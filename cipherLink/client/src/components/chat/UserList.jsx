import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, MessageSquare, Loader2, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { Avatar } from '../ui/Avatar';
import { Input } from '../ui/Input';
import { cn, debounce } from '../../lib/utils';

export function UserList() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        onlineUsers,
        allUsers,
        isLoadingUsers,
        loadOnlineUsers,
        loadAllUsers,
        searchUsers,
        openPrivateChat
    } = useChatStore();

    // Load users on mount
    useEffect(() => {
        loadOnlineUsers();
        loadAllUsers();
    }, []);

    // Search users
    useEffect(() => {
        const search = debounce((query) => {
            if (query) {
                searchUsers(query);
            } else {
                loadAllUsers();
            }
        }, 300);

        search(searchQuery);
    }, [searchQuery]);

    const handleStartChat = async (targetUser) => {
        await openPrivateChat(targetUser);
        // Navigate to the DM
        const { currentChannel } = useChatStore.getState();
        navigate(`/chat/dm/${currentChannel}`);
    };

    const displayUsers = searchQuery ? allUsers : onlineUsers;

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-dark-700/50 bg-dark-900/30 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-dark-100">Users</h2>
                        <p className="text-xs text-dark-400">
                            {onlineUsers.length} online • Click to start encrypted chat
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="input-base pl-10"
                    />
                </div>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoadingUsers ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                ) : displayUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-dark-400">
                        <Users className="w-8 h-8 mb-2 opacity-50" />
                        <p>{searchQuery ? 'No users found' : 'No users online'}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Online users section */}
                        {!searchQuery && onlineUsers.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2 px-2">
                                    Online Now
                                </h3>
                                {onlineUsers.map((u, index) => (
                                    <UserCard
                                        key={u._id || u.publicKeyHash}
                                        user={u}
                                        index={index}
                                        onStartChat={handleStartChat}
                                        isOnline={true}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Search results or all users */}
                        {searchQuery && allUsers.length > 0 && (
                            <div>
                                <h3 className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2 px-2">
                                    Search Results
                                </h3>
                                {allUsers.map((u, index) => (
                                    <UserCard
                                        key={u._id || u.publicKeyHash}
                                        user={u}
                                        index={index}
                                        onStartChat={handleStartChat}
                                        isOnline={!!u.status}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function UserCard({ user, index, onStartChat, isOnline }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                'flex items-center gap-3 p-3 rounded-xl cursor-pointer',
                'hover:bg-dark-800/50 transition-all duration-200 group'
            )}
            onClick={() => onStartChat(user)}
        >
            <Avatar username={user.username} size="md" isOnline={isOnline} />

            <div className="flex-1 min-w-0">
                <p className="font-medium text-dark-100 truncate">{user.username}</p>
                <p className="text-xs text-dark-400 truncate">
                    {user.bio || 'CipherLink user'}
                </p>
            </div>

            <button className="p-2 rounded-lg bg-primary-500/10 text-primary-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary-500/20">
                <MessageSquare className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
