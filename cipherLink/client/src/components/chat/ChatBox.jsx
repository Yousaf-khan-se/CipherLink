import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Send, Loader2, Shield, ArrowLeft, Fingerprint } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { userApi } from '../../lib/api';
import { generateFingerprint, generateChannelId } from '../../lib/crypto';
import { ChatBubble } from './ChatBubble';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import socketService from '../../lib/socket';

export function ChatBox() {
    const { channelId } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showFingerprint, setShowFingerprint] = useState(false);
    const [fingerprint, setFingerprint] = useState('');
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    const { user, privateKey } = useAuthStore();
    const {
        messages,
        isLoadingMessages,
        currentChatmate,
        typingUsers,
        setCurrentChannel,
        sendMessage,
        loadMessages
    } = useChatStore();

    // Set current channel on mount
    useEffect(() => {
        if (channelId && currentChatmate) {
            setCurrentChannel(channelId, currentChatmate);
        }
    }, [channelId, currentChatmate]);

    // Generate fingerprint for verification
    useEffect(() => {
        const getFingerprint = async () => {
            if (currentChatmate?.publicKey) {
                const fp = await generateFingerprint(currentChatmate.publicKey);
                setFingerprint(fp);
            }
        };
        getFingerprint();
    }, [currentChatmate]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Typing indicator with proper debouncing
    const handleTyping = useCallback(() => {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Emit typing start only if not already typing
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socketService.emitTypingStart({
                channel: channelId,
                username: user.username,
                receiverPublicKeyHash: currentChatmate?.publicKeyHash
            });
        }

        // Stop typing after 2 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            socketService.emitTypingStop({
                channel: channelId,
                username: user.username,
                receiverPublicKeyHash: currentChatmate?.publicKeyHash
            });
            typingTimeoutRef.current = null;
        }, 2000);
    }, [channelId, user.username, currentChatmate?.publicKeyHash]);

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

    if (!currentChatmate) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-dark-400">Loading conversation...</p>
                </div>
            </div>
        );
    }

    const typingUser = typingUsers[channelId];

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-dark-700/50 bg-dark-900/30 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/chat/inbox')}
                        className="p-2 hover:bg-dark-800/50 rounded-lg text-dark-400 hover:text-dark-200 transition-colors md:hidden"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <Avatar
                        username={currentChatmate.username}
                        size="md"
                        isOnline={currentChatmate.status === 'online' || !!currentChatmate.status}
                    />

                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-dark-100 truncate">
                            {currentChatmate.username}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-primary-400">
                            <Lock className="w-3 h-3" />
                            <span>End-to-end encrypted</span>
                        </div>
                    </div>

                    {/* Fingerprint button */}
                    <button
                        onClick={() => setShowFingerprint(!showFingerprint)}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            showFingerprint
                                ? 'bg-primary-500/20 text-primary-400'
                                : 'hover:bg-dark-800/50 text-dark-400 hover:text-dark-200'
                        )}
                        title="Verify security"
                    >
                        <Fingerprint className="w-5 h-5" />
                    </button>
                </div>

                {/* Fingerprint display */}
                <AnimatePresence>
                    {showFingerprint && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-3 bg-dark-800/50 rounded-lg border border-primary-500/20"
                        >
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-primary-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-dark-400 mb-1">
                                        {currentChatmate.username}'s security fingerprint:
                                    </p>
                                    <p className="font-mono text-sm text-primary-400 tracking-wider">
                                        {fingerprint}
                                    </p>
                                    <p className="text-[10px] text-dark-500 mt-1">
                                        Verify this matches on your contact's device for added security
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
                            <p className="text-dark-400 text-sm">Decrypting messages...</p>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Lock className="w-12 h-12 text-primary-500/30 mx-auto mb-4" />
                            <p className="text-dark-400">No messages yet.</p>
                            <p className="text-dark-500 text-sm mt-1">
                                Messages are end-to-end encrypted
                            </p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence>
                        {messages.map((msg, index) => (
                            <ChatBubble
                                key={msg._id || index}
                                message={msg}
                                isOwn={msg.senderPublicKeyHash === user.publicKeyHash}
                                showSender={false}
                                isEncrypted={true}
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
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                        onChange={(e) => {
                            setMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Type an encrypted message..."
                        className="input-base flex-1"
                        maxLength={2000}
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || isSending}
                        className={cn(
                            'p-3 rounded-lg transition-all duration-200',
                            'bg-gradient-to-r from-primary-600 to-primary-500',
                            'hover:from-primary-500 hover:to-primary-400 text-white',
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
                <p className="text-[10px] text-dark-500 mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Messages are encrypted with AES-256-GCM
                </p>
            </form>
        </div>
    );
}
