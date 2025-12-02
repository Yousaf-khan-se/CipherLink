import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.pendingUserData = null; // Store user data to emit when connected
    }

    /**
     * Connect to socket server with authentication
     * @param {string} token - JWT token for authentication
     */
    connect(token) {
        if (this.socket?.connected) {
            return this.socket;
        }

        // If socket exists but is disconnected, clean it up first
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket = null;
        }

        const socketUrl = import.meta.env.VITE_SOCKET_URL || '';

        this.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            randomizationFactor: 0.5,
            timeout: 20000,
            auth: {
                token: token // Send JWT token for socket authentication
            }
        });

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected:', this.socket.id);

            // Emit pending user-online event if we have user data waiting
            if (this.pendingUserData) {
                console.log('📤 Emitting pending user-online for:', this.pendingUserData.username);
                this.socket.emit('user-online', this.pendingUserData);
                this.pendingUserData = null;
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
            // Don't log reconnection attempts as errors
            if (reason === 'io server disconnect') {
                // Server disconnected us, might need to reconnect manually
                this.socket.connect();
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');

            // Re-emit user-online on reconnect if we have stored user data
            if (this.pendingUserData) {
                console.log('📤 Re-emitting user-online after reconnect for:', this.pendingUserData.username);
                this.socket.emit('user-online', this.pendingUserData);
            }
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            // Silent - don't log each attempt to reduce console noise
        });

        this.socket.on('reconnect_error', (error) => {
            // Silent - don't log reconnect errors to reduce console noise
        });

        this.socket.on('connect_error', (error) => {
            // Only log authentication errors, not connection errors
            if (error.message === 'Authentication required' || error.message === 'Invalid token' || error.message === 'Token expired') {
                console.warn('🔒 Socket authentication failed:', error.message);
            }
        });

        return this.socket;
    }

    /**
     * Disconnect from socket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
        }
    }

    /**
     * Get socket instance
     */
    getSocket() {
        return this.socket;
    }

    /**
     * Get socket ID
     */
    getSocketId() {
        return this.socket?.id;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.socket?.connected || false;
    }

    /**
     * Emit event to server
     */
    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit:', event);
        }
    }

    /**
     * Subscribe to event
     */
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);

            // Track listener for cleanup
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }
    }

    /**
     * Unsubscribe from event
     */
    off(event, callback) {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);

                const eventListeners = this.listeners.get(event);
                if (eventListeners) {
                    const index = eventListeners.indexOf(callback);
                    if (index > -1) {
                        eventListeners.splice(index, 1);
                    }
                }
            } else {
                // Remove all listeners for this event
                this.socket.off(event);
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Emit user online status
     */
    emitUserOnline(userData) {
        const data = {
            userId: userData._id,
            username: userData.username,
            publicKeyHash: userData.publicKeyHash
        };

        if (this.socket?.connected) {
            console.log('📤 Emitting user-online immediately for:', userData.username);
            this.socket.emit('user-online', data);
        } else {
            // Store for later emission when socket connects
            console.log('⏳ Socket not connected, queuing user-online for:', userData.username);
            this.pendingUserData = data;
        }
    }

    /**
     * Emit user offline status
     */
    emitUserOffline() {
        this.emit('user-offline', {});
    }

    /**
     * Emit new message
     */
    emitNewMessage(messageData) {
        this.emit('new-message', messageData);
    }

    /**
     * Emit typing indicator
     */
    emitTypingStart(data) {
        this.emit('typing-start', data);
    }

    emitTypingStop(data) {
        this.emit('typing-stop', data);
    }

    /**
     * Emit message seen
     */
    emitMessageSeen(data) {
        this.emit('message-seen', data);
    }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
