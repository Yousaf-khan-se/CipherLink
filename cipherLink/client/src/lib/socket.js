import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    /**
     * Connect to socket server
     */
    connect() {
        if (this.socket?.connected) {
            return this.socket;
        }

        const socketUrl = import.meta.env.VITE_SOCKET_URL || '';

        this.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected:', this.socket.id);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔌 Socket connection error:', error.message);
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
        this.emit('user-online', {
            userId: userData._id,
            username: userData.username,
            publicKeyHash: userData.publicKeyHash
        });
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
