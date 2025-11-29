import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import socketService from '../lib/socket';

// Components
import { Sidebar } from '../components/chat/Sidebar';
import { ChatBox } from '../components/chat/ChatBox';
import { GlobalChat } from '../components/chat/GlobalChat';
import { UserList } from '../components/chat/UserList';
import { Inbox } from '../components/chat/Inbox';
import { WelcomeScreen } from '../components/chat/WelcomeScreen';

export default function ChatPage() {
    const { user } = useAuthStore();
    const {
        loadOnlineUsers,
        loadPrivateChannels,
        handleUserConnected,
        handleUserDisconnected,
        receiveMessage,
        handleTypingStart,
        handleTypingStop
    } = useChatStore();

    // Load initial data on mount
    useEffect(() => {
        loadOnlineUsers();
        loadPrivateChannels();
    }, [loadOnlineUsers, loadPrivateChannels]);

    // Setup socket listeners - use refs to avoid stale closures
    useEffect(() => {
        // Store current handler references
        const handlers = {
            userConnected: handleUserConnected,
            userDisconnected: handleUserDisconnected,
            messageReceived: receiveMessage,
            typingStart: handleTypingStart,
            typingStop: handleTypingStop
        };

        // Setup socket event listeners
        socketService.on('user-connected', handlers.userConnected);
        socketService.on('user-disconnected', handlers.userDisconnected);
        socketService.on('message-received', handlers.messageReceived);
        socketService.on('user-typing', handlers.typingStart);
        socketService.on('user-stopped-typing', handlers.typingStop);

        // Cleanup on unmount or when handlers change
        return () => {
            socketService.off('user-connected', handlers.userConnected);
            socketService.off('user-disconnected', handlers.userDisconnected);
            socketService.off('message-received', handlers.messageReceived);
            socketService.off('user-typing', handlers.typingStart);
            socketService.off('user-stopped-typing', handlers.typingStop);
        };
    }, [handleUserConnected, handleUserDisconnected, receiveMessage, handleTypingStart, handleTypingStop]);

    return (
        <div className="h-screen flex bg-dark-950">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <Routes>
                    <Route path="/" element={<WelcomeScreen />} />
                    <Route path="/global" element={<GlobalChat />} />
                    <Route path="/users" element={<UserList />} />
                    <Route path="/inbox" element={<Inbox />} />
                    <Route path="/dm/:channelId" element={<ChatBox />} />
                    <Route path="*" element={<Navigate to="/chat" replace />} />
                </Routes>
            </main>
        </div>
    );
}
