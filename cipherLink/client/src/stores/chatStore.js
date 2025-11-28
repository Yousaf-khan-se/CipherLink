import { create } from 'zustand';
import { chatApi, userApi } from '../lib/api';
import { useAuthStore } from './authStore';
import {
    generateChannelId,
    encryptMessage,
    decryptMessage
} from '../lib/crypto';
import socketService from '../lib/socket';

export const useChatStore = create((set, get) => ({
    // Current channel
    currentChannel: 'global',
    currentChatmate: null,

    // Messages for current channel
    messages: [],
    isLoadingMessages: false,

    // Private channels list
    privateChannels: [],
    isLoadingChannels: false,

    // Online users
    onlineUsers: [],
    isLoadingUsers: false,

    // All users for search
    allUsers: [],

    // Typing indicators
    typingUsers: {},

    // Unread counts
    unreadCounts: {},

    /**
     * Set current channel
     */
    setCurrentChannel: async (channel, chatmate = null) => {
        set({
            currentChannel: channel,
            currentChatmate: chatmate,
            messages: []
        });

        // Load messages for this channel
        await get().loadMessages(channel);

        // Mark channel as seen
        if (channel !== 'global') {
            await get().markChannelSeen(channel);
        }
    },

    /**
     * Open private chat with a user
     */
    openPrivateChat: async (user) => {
        const { publicKeyHash } = useAuthStore.getState().user;

        // Generate deterministic channel ID
        const channelId = await generateChannelId(publicKeyHash, user.publicKeyHash);

        set({
            currentChannel: channelId,
            currentChatmate: user,
            messages: []
        });

        await get().loadMessages(channelId);
        await get().markChannelSeen(channelId);
    },

    /**
     * Load messages for a channel
     */
    loadMessages: async (channel) => {
        try {
            set({ isLoadingMessages: true });

            const response = await chatApi.getMessages(channel, { limit: 50 });
            let messages = response.data;

            // Decrypt private messages
            if (channel !== 'global') {
                const { privateKey } = useAuthStore.getState();
                const { currentChatmate } = get();

                if (currentChatmate?.publicKey && privateKey) {
                    messages = await Promise.all(
                        messages.map(async (msg) => {
                            if (msg.messageType === 'encrypted') {
                                return decryptMessage(msg, privateKey, currentChatmate.publicKey);
                            }
                            return msg;
                        })
                    );
                }
            }

            set({ messages, isLoadingMessages: false });
        } catch (error) {
            console.error('Failed to load messages:', error);
            set({ isLoadingMessages: false });
        }
    },

    /**
     * Send a message
     */
    sendMessage: async (content) => {
        try {
            const { currentChannel, currentChatmate } = get();
            const { user, privateKey, publicKey } = useAuthStore.getState();

            const timestamp = new Date().toISOString();

            let messageData = {
                senderName: user.username,
                message: content,
                channel: currentChannel,
                timestamp,
                senderPublicKeyHash: user.publicKeyHash,
                receiverPublicKeyHash: currentChatmate?.publicKeyHash || null,
                messageType: 'text'
            };

            // Encrypt for private channels
            if (currentChannel !== 'global' && currentChatmate?.publicKey) {
                messageData = await encryptMessage(
                    messageData,
                    privateKey,
                    currentChatmate.publicKey
                );
            }

            // Save to database
            const response = await chatApi.sendMessage(messageData);
            const savedMessage = response.data;

            // Add decrypted version to local state
            const localMessage = {
                ...savedMessage,
                senderName: user.username,
                message: content,
                timestamp,
                decrypted: true
            };

            set((state) => ({
                messages: [...state.messages, localMessage]
            }));

            // Broadcast via socket
            socketService.emitNewMessage(savedMessage);

            return { success: true };
        } catch (error) {
            console.error('Failed to send message:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Receive a message (from socket)
     */
    receiveMessage: async (messageData) => {
        const { currentChannel, currentChatmate } = get();
        const { user, privateKey } = useAuthStore.getState();

        // Check if message is for current channel
        if (messageData.channel === currentChannel) {
            let message = messageData;

            // Decrypt if needed
            if (messageData.messageType === 'encrypted' && currentChatmate?.publicKey) {
                message = await decryptMessage(messageData, privateKey, currentChatmate.publicKey);
            }

            set((state) => ({
                messages: [...state.messages, message]
            }));
        } else if (messageData.channel !== 'global') {
            // Update unread count for other channels
            set((state) => ({
                unreadCounts: {
                    ...state.unreadCounts,
                    [messageData.channel]: (state.unreadCounts[messageData.channel] || 0) + 1
                }
            }));
        }
    },

    /**
     * Load private channels
     */
    loadPrivateChannels: async () => {
        try {
            set({ isLoadingChannels: true });
            const response = await chatApi.getPrivateChannels();
            set({ privateChannels: response.data, isLoadingChannels: false });
        } catch (error) {
            console.error('Failed to load private channels:', error);
            set({ isLoadingChannels: false });
        }
    },

    /**
     * Load online users
     */
    loadOnlineUsers: async () => {
        try {
            set({ isLoadingUsers: true });
            const response = await userApi.getOnlineUsers();
            set({ onlineUsers: response.data, isLoadingUsers: false });
        } catch (error) {
            console.error('Failed to load online users:', error);
            set({ isLoadingUsers: false });
        }
    },

    /**
     * Search users
     */
    searchUsers: async (query) => {
        try {
            if (!query || query.length < 1) {
                set({ allUsers: [] });
                return;
            }
            const response = await userApi.searchUsers(query);
            set({ allUsers: response.data });
        } catch (error) {
            console.error('Failed to search users:', error);
        }
    },

    /**
     * Load all users
     */
    loadAllUsers: async () => {
        try {
            set({ isLoadingUsers: true });
            const response = await userApi.getAllUsers({ limit: 50 });
            set({ allUsers: response.data.users, isLoadingUsers: false });
        } catch (error) {
            console.error('Failed to load all users:', error);
            set({ isLoadingUsers: false });
        }
    },

    /**
     * Mark channel messages as seen
     */
    markChannelSeen: async (channel) => {
        try {
            await chatApi.markChannelSeen(channel);
            set((state) => ({
                unreadCounts: {
                    ...state.unreadCounts,
                    [channel]: 0
                }
            }));
        } catch (error) {
            console.error('Failed to mark channel seen:', error);
        }
    },

    /**
     * Handle user connected (from socket)
     */
    handleUserConnected: (userData) => {
        set((state) => {
            const exists = state.onlineUsers.some(u => u.publicKeyHash === userData.publicKeyHash);
            if (exists) return state;

            return {
                onlineUsers: [...state.onlineUsers, userData]
            };
        });
    },

    /**
     * Handle user disconnected (from socket)
     */
    handleUserDisconnected: (userData) => {
        set((state) => ({
            onlineUsers: state.onlineUsers.filter(u => u.publicKeyHash !== userData.publicKeyHash)
        }));
    },

    /**
     * Handle typing indicator
     */
    handleTypingStart: (data) => {
        set((state) => ({
            typingUsers: {
                ...state.typingUsers,
                [data.channel]: data.username
            }
        }));
    },

    handleTypingStop: (data) => {
        set((state) => {
            const newTyping = { ...state.typingUsers };
            delete newTyping[data.channel];
            return { typingUsers: newTyping };
        });
    },

    /**
     * Clear chat state
     */
    clearChat: () => {
        set({
            currentChannel: 'global',
            currentChatmate: null,
            messages: [],
            privateChannels: [],
            onlineUsers: [],
            allUsers: [],
            typingUsers: {},
            unreadCounts: {}
        });
    }
}));
