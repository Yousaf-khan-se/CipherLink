import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * Initialize Socket.io event handlers
 * @param {Server} io - Socket.io server instance
 */
export const initializeSocket = (io) => {
    // Store active connections
    const activeConnections = new Map();

    // Socket authentication middleware - verify JWT token on connection
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // Attach verified user data to socket
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new Error('Token expired'));
            }
            return next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 New authenticated connection: ${socket.id} (${socket.user?.username})`);

        /**
         * Handle user coming online
         */
        socket.on('user-online', async (data) => {
            try {
                const { userId, username, publicKeyHash } = data;

                console.log(`\n📥 [SERVER] USER-ONLINE event received`);
                console.log(`   Username: ${username}`);
                console.log(`   Socket ID: ${socket.id}`);

                if (!userId || !username) {
                    console.log(`   ⚠️ Missing userId or username, ignoring`);
                    return;
                }

                // Store connection info
                activeConnections.set(socket.id, {
                    userId,
                    username,
                    publicKeyHash
                });

                // Update user status in database
                await User.findByIdAndUpdate(userId, {
                    status: socket.id,
                    lastSeen: new Date()
                });

                // Join user-specific room for private notifications
                socket.join(`user:${userId}`);
                socket.join(`user:${publicKeyHash}`);

                console.log(`   ✅ User joined private rooms`);

                // Broadcast to all other users
                socket.broadcast.emit('user-connected', {
                    userId,
                    username,
                    publicKeyHash,
                    socketId: socket.id
                });

                console.log(`✅ User online: ${username} (${socket.id})\n`);
            } catch (err) {
                console.error('user-online error:', err);
            }
        });

        /**
         * Handle user going offline manually
         */
        socket.on('user-offline', async () => {
            await handleDisconnect(socket);
        });

        /**
         * Handle new message broadcast
         */
        socket.on('new-message', (messageData) => {
            try {
                const { channel, receiverPublicKeyHash, senderPublicKeyHash, messageType } = messageData;
                const msgType = channel === 'global' ? 'GLOBAL' : 'PRIVATE/ENCRYPTED';

                console.log(`\n📨 [SERVER] NEW MESSAGE RECEIVED`);
                console.log(`   Type: ${msgType}`);
                console.log(`   MessageType: ${messageType}`);

                if (channel === 'global') {
                    // Broadcast to everyone in global channel
                    console.log(`   ➡️  Broadcasting to all users (global)`);
                    socket.broadcast.emit('message-received', messageData);
                } else {
                    // Send to specific user's room
                    if (receiverPublicKeyHash) {
                        const targetRoom = `user:${receiverPublicKeyHash}`;
                        console.log(`   ➡️  Emitting 'message-received' to recipient`);
                        socket.to(targetRoom).emit('message-received', messageData);
                    } else {
                        console.log(`   ⚠️  No receiver specified for private message!`);
                    }
                    // Also emit to sender for multi-device support
                    console.log(`   ➡️  Emitting 'message-sent' back to sender`);
                    socket.emit('message-sent', messageData);
                }
                console.log(`   ✅ Message routing complete\n`);
            } catch (err) {
                console.error('new-message error:', err);
            }
        });

        /**
         * Handle typing indicator
         */
        socket.on('typing-start', (data) => {
            const { channel, username, receiverPublicKeyHash } = data;

            if (channel === 'global') {
                socket.broadcast.emit('user-typing', { channel, username });
            } else if (receiverPublicKeyHash) {
                socket.to(`user:${receiverPublicKeyHash}`).emit('user-typing', { channel, username });
            }
        });

        socket.on('typing-stop', (data) => {
            const { channel, username, receiverPublicKeyHash } = data;

            if (channel === 'global') {
                socket.broadcast.emit('user-stopped-typing', { channel, username });
            } else if (receiverPublicKeyHash) {
                socket.to(`user:${receiverPublicKeyHash}`).emit('user-stopped-typing', { channel, username });
            }
        });

        /**
         * Handle message seen notification
         */
        socket.on('message-seen', (data) => {
            const { messageId, channel, senderPublicKeyHash } = data;

            if (senderPublicKeyHash) {
                socket.to(`user:${senderPublicKeyHash}`).emit('message-marked-seen', {
                    messageId,
                    channel
                });
            }
        });

        /**
         * Handle disconnection
         */
        socket.on('disconnect', async () => {
            await handleDisconnect(socket);
        });

        /**
         * Helper function to handle user disconnect
         */
        async function handleDisconnect(socket) {
            try {
                const connectionInfo = activeConnections.get(socket.id);

                if (connectionInfo) {
                    const { userId, username, publicKeyHash } = connectionInfo;

                    // Update user status in database
                    await User.findByIdAndUpdate(userId, {
                        status: '',
                        lastSeen: new Date()
                    });

                    // Remove from active connections
                    activeConnections.delete(socket.id);

                    // Broadcast to all other users
                    socket.broadcast.emit('user-disconnected', {
                        userId,
                        username,
                        publicKeyHash
                    });

                    console.log(`👋 User offline: ${username} (${socket.id})`);
                }
            } catch (err) {
                console.error('disconnect error:', err);
            }
        }

        /**
         * Handle errors
         */
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    // Periodic cleanup of stale connections
    setInterval(async () => {
        try {
            // Find users with stale socket IDs
            const staleUsers = await User.find({
                status: { $ne: '' },
                lastSeen: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes
            });

            for (const user of staleUsers) {
                // Check if socket is still connected
                const socketId = user.status;
                const socket = io.sockets.sockets.get(socketId);

                if (!socket) {
                    await User.findByIdAndUpdate(user._id, { status: '' });
                    console.log(`🧹 Cleaned stale status: ${user.username}`);
                }
            }
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    }, 60000); // Run every minute

    console.log('🔌 Socket.io initialized');
};
