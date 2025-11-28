import { motion } from 'framer-motion';
import { Shield, Lock, Key, Zap } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Logo } from '../ui/Logo';

export function WelcomeScreen() {
    const { user } = useAuthStore();

    const features = [
        {
            icon: Key,
            title: 'ECDH Key Exchange',
            description: 'P-521 elliptic curve for secure key agreement'
        },
        {
            icon: Lock,
            title: 'AES-256-GCM',
            description: 'Military-grade symmetric encryption'
        },
        {
            icon: Shield,
            title: 'PBKDF2 Hashing',
            description: '75,000 iterations with SHA-512'
        },
        {
            icon: Zap,
            title: 'Real-time Secure',
            description: 'Encrypted WebSocket communication'
        }
    ];

    return (
        <div className="flex-1 flex items-center justify-center p-8 cyber-bg">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-2xl"
            >
                <div className="mb-8">
                    <Logo size="xl" />
                </div>

                <h1 className="text-3xl font-bold text-dark-100 mb-3">
                    Welcome, <span className="gradient-text">{user?.username}</span>!
                </h1>
                <p className="text-dark-400 text-lg mb-12">
                    Your messages are protected with end-to-end encryption.
                    Only you and your recipient can read them.
                </p>

                {/* Feature grid */}
                <div className="grid grid-cols-2 gap-4 mb-12">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass p-4 rounded-xl text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center mb-3">
                                <feature.icon className="w-5 h-5 text-primary-400" />
                            </div>
                            <h3 className="font-semibold text-dark-100 mb-1">{feature.title}</h3>
                            <p className="text-sm text-dark-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Getting started */}
                <div className="bg-dark-800/30 rounded-xl p-6 border border-dark-700/30">
                    <h2 className="font-semibold text-dark-200 mb-4">Getting Started</h2>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center mx-auto mb-2 font-bold">
                                1
                            </div>
                            <p className="text-dark-400">Join Global Chat</p>
                        </div>
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center mx-auto mb-2 font-bold">
                                2
                            </div>
                            <p className="text-dark-400">Find Users</p>
                        </div>
                        <div className="text-center">
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center mx-auto mb-2 font-bold">
                                3
                            </div>
                            <p className="text-dark-400">Start Private Chat</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
