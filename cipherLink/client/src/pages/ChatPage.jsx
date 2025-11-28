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

    // Setup socket listeners
    useEffect(() => {
        // Load initial data
        loadOnlineUsers();
        loadPrivateChannels();

        // Setup socket event listeners
        socketService.on('user-connected', handleUserConnected);
        socketService.on('user-disconnected', handleUserDisconnected);
        socketService.on('message-received', receiveMessage);
        socketService.on('user-typing', handleTypingStart);
        socketService.on('user-stopped-typing', handleTypingStop);

        // Cleanup on unmount
        return () => {
            socketService.off('user-connected', handleUserConnected);
            socketService.off('user-disconnected', handleUserDisconnected);
            socketService.off('message-received', receiveMessage);
            socketService.off('user-typing', handleTypingStart);
            socketService.off('user-stopped-typing', handleTypingStop);
        };
    }, []);

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
