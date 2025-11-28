import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { ChatBubble } from './ChatBubble';
import { Input } from '../ui/Input';
import { formatMessageTime, cn } from '../../lib/utils';
import socketService from '../../lib/socket';

export function GlobalChat() {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useAuthStore();
    const {
        messages,
        isLoadingMessages,
        typingUsers,
        setCurrentChannel,
        sendMessage
    } = useChatStore();

    // Load global channel on mount
    useEffect(() => {
        setCurrentChannel('global', null);
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();

        if (!message.trim() || isSending) return;

        setIsSending(true);
        const result = await sendMessage(message.trim());
        setIsSending(false);

        if (result.success) {
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSend(e);
        }
    };

    const typingUser = typingUsers['global'];

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-dark-700/50 bg-dark-900/30 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-dark-100">Global Chat</h2>
                        <p className="text-xs text-dark-400">Public room • Messages not encrypted</p>
                    </div>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-dark-400">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {messages.map((msg, index) => (
                            <ChatBubble
                                key={msg._id || index}
                                message={msg}
                                isOwn={msg.senderPublicKeyHash === user.publicKeyHash || msg.senderName === user.username}
                                showSender={true}
                            />
                        ))}
                    </AnimatePresence>
                )}

                {/* Typing indicator */}
                {typingUser && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-dark-400 text-sm"
                    >
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>{typingUser} is typing...</span>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSend} className="p-4 border-t border-dark-700/50 bg-dark-900/30">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="input-base flex-1"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || isSending}
                        className={cn(
                            'p-3 rounded-lg transition-all duration-200',
                            'bg-primary-500 hover:bg-primary-400 text-white',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500/50'
                        )}
                    >
                        {isSending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
