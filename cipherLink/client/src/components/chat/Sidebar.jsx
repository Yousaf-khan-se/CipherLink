import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    Users,
    Inbox,
    Globe,
    LogOut,
    Settings,
    ChevronLeft,
    ChevronRight,
    Shield
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { Avatar } from '../ui/Avatar';
import { Logo, LogoIcon } from '../ui/Logo';
import { cn } from '../../lib/utils';

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuthStore();
    const { unreadCounts, clearChat } = useChatStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        clearChat();
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            path: '/chat/global',
            icon: Globe,
            label: 'Global Chat',
            description: 'Public chat room'
        },
        {
            path: '/chat/inbox',
            icon: Inbox,
            label: 'Inbox',
            description: 'Private conversations',
            badge: Object.values(unreadCounts).reduce((a, b) => a + b, 0)
        },
        {
            path: '/chat/users',
            icon: Users,
            label: 'Users',
            description: 'Find people to chat'
        },
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 72 : 280 }}
            className="h-full flex flex-col bg-dark-900/50 border-r border-dark-700/50 backdrop-blur-xl"
        >
            {/* Header */}
            <div className="p-4 border-b border-dark-700/50">
                <div className="flex items-center justify-between">
                    {collapsed ? (
                        <LogoIcon className="w-10 h-10 mx-auto" />
                    ) : (
                        <Logo size="default" />
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 hover:bg-dark-800/50 rounded-lg text-dark-400 hover:text-dark-200 transition-colors"
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                            'hover:bg-dark-800/50',
                            isActive && 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
                            !isActive && 'text-dark-300 hover:text-dark-100'
                        )}
                    >
                        <div className="relative">
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {item.badge > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                                    {item.badge > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{item.label}</p>
                                <p className="text-xs text-dark-500 truncate">{item.description}</p>
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Security indicator */}
            {!collapsed && (
                <div className="px-4 py-3 mx-3 mb-3 bg-dark-800/30 rounded-lg border border-dark-700/30">
                    <div className="flex items-center gap-2 text-primary-400">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-medium">E2E Encrypted</span>
                    </div>
                    <p className="text-[10px] text-dark-500 mt-1">
                        Messages secured with ECDH + AES-256
                    </p>
                </div>
            )}

            {/* User profile */}
            <div className="p-3 border-t border-dark-700/50">
                <div className={cn(
                    'flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800/50 transition-colors',
                    collapsed && 'justify-center'
                )}>
                    <Avatar username={user?.username} size="md" isOnline={true} />
                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-dark-100 truncate">{user?.username}</p>
                            <p className="text-xs text-dark-500 truncate">{user?.bio || 'Online'}</p>
                        </div>
                    )}
                </div>

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-lg',
                        'text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200',
                        collapsed && 'justify-center'
                    )}
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </motion.aside>
    );
}
