import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Inbox as InboxIcon, Lock, Loader2, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { userApi } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import { formatRelativeTime, cn, truncate } from '../../lib/utils';
import { decryptMessage } from '../../lib/crypto';

export function Inbox() {
    const [channels, setChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { user, privateKey } = useAuthStore();
    const {
        privateChannels,
        unreadCounts,
        loadPrivateChannels,
        setCurrentChannel
    } = useChatStore();

    // Load private channels with user info
    useEffect(() => {
        const loadChannelsWithUsers = async () => {
            setIsLoading(true);
            await loadPrivateChannels();

            // Get user info for each channel
            const channelsWithUsers = await Promise.all(
                privateChannels.map(async (channel) => {
                    const lastMsg = channel.lastMessage;

                    // Determine the other user's public key hash
                    const otherUserHash = lastMsg.senderPublicKeyHash === user.publicKeyHash
                        ? lastMsg.receiverPublicKeyHash
                        : lastMsg.senderPublicKeyHash;

                    try {
                        const response = await userApi.getUserByHash(otherUserHash);
                        const otherUser = response.data;

                        // Try to decrypt last message preview
                        let preview = 'Encrypted message';
                        if (otherUser.publicKey && privateKey) {
                            try {
                                const decrypted = await decryptMessage(lastMsg, privateKey, otherUser.publicKey);
                                preview = decrypted.message || 'Encrypted message';
                            } catch {
                                // Keep encrypted preview
                            }
                        }

                        return {
                            ...channel,
                            otherUser,
                            preview,
                            unread: unreadCounts[channel._id] || channel.unreadCount || 0
                        };
                    } catch {
                        return {
                            ...channel,
                            otherUser: { username: 'Unknown', publicKeyHash: otherUserHash },
                            preview: 'Encrypted message',
                            unread: 0
                        };
                    }
                })
            );

            setChannels(channelsWithUsers);
            setIsLoading(false);
        };

        loadChannelsWithUsers();
    }, [privateChannels.length]);

    const handleOpenChat = async (channel) => {
        await setCurrentChannel(channel._id, channel.otherUser);
        navigate(`/chat/dm/${channel._id}`);
    };

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-dark-700/50 bg-dark-900/30 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <InboxIcon className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-dark-100">Inbox</h2>
                        <p className="text-xs text-dark-400">
                            Your private encrypted conversations
                        </p>
                    </div>
                </div>
            </div>

            {/* Channel list */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                ) : channels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-dark-800/50 flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-dark-500" />
                        </div>
                        <h3 className="font-medium text-dark-300 mb-2">No conversations yet</h3>
                        <p className="text-dark-500 text-sm">
                            Start a private chat from the Users tab. All messages are end-to-end encrypted.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {channels.map((channel, index) => (
                            <motion.div
                                key={channel._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleOpenChat(channel)}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-xl cursor-pointer',
                                    'hover:bg-dark-800/50 transition-all duration-200',
                                    channel.unread > 0 && 'bg-primary-500/5 border border-primary-500/20'
                                )}
                            >
                                <Avatar
                                    username={channel.otherUser?.username}
                                    size="md"
                                    isOnline={!!channel.otherUser?.status}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-dark-100 truncate">
                                            {channel.otherUser?.username || 'Unknown'}
                                        </p>
                                        <Lock className="w-3 h-3 text-primary-400 flex-shrink-0" />
                                    </div>
                                    <p className="text-xs text-dark-400 truncate">
                                        {truncate(channel.preview, 40)}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] text-dark-500">
                                        {formatRelativeTime(channel.lastMessage?.serverTimestamp)}
                                    </span>
                                    {channel.unread > 0 && (
                                        <span className="w-5 h-5 bg-primary-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                                            {channel.unread > 9 ? '9+' : channel.unread}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
