import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/toastStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading, error } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error('Validation Error', 'Please fill in all fields');
            return;
        }

        const result = await login(username, password);

        if (result.success) {
            toast.success('Welcome back!', 'Successfully logged in');
        } else {
            toast.error('Login Failed', result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 cyber-bg">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-block"
                    >
                        <Logo size="xl" />
                    </motion.div>
                </div>

                {/* Card */}
                <div className="card">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-dark-100">Welcome Back</h1>
                        <p className="text-dark-400 mt-1">Sign in to continue messaging securely</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5">
                                Username
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter your username"
                                icon={User}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    icon={Lock}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-dark-700/50 text-center">
                        <p className="text-dark-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Security badge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 flex items-center justify-center gap-2 text-dark-500"
                >
                    <Shield className="w-4 h-4" />
                    <span className="text-xs">End-to-end encrypted with ECDH & AES-256</span>
                </motion.div>
            </motion.div>
        </div>
    );
}
