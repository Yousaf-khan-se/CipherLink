import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Shield, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../stores/toastStore';
import { authApi } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { isValidUsername, getPasswordStrength, debounce } from '../lib/utils';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null });
    const { register, isLoading } = useAuthStore();

    const passwordStrength = getPasswordStrength(password);
    const passwordsMatch = password && confirmPassword && password === confirmPassword;

    // Check username availability
    useEffect(() => {
        const checkUsername = debounce(async (name) => {
            if (!name || name.length < 2) {
                setUsernameStatus({ checking: false, available: null });
                return;
            }

            if (!isValidUsername(name)) {
                setUsernameStatus({ checking: false, available: false, error: 'Invalid format' });
                return;
            }

            setUsernameStatus({ checking: true, available: null });

            try {
                const response = await authApi.checkUsername(name);
                setUsernameStatus({ checking: false, available: response.data.available });
            } catch {
                setUsernameStatus({ checking: false, available: null });
            }
        }, 500);

        checkUsername(username);
    }, [username]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!username || !password || !confirmPassword) {
            toast.error('Validation Error', 'Please fill in all fields');
            return;
        }

        if (!isValidUsername(username)) {
            toast.error('Invalid Username', 'Use 2-20 characters: letters, numbers, underscores');
            return;
        }

        if (usernameStatus.available === false) {
            toast.error('Username Taken', 'Please choose a different username');
            return;
        }

        if (password.length < 8) {
            toast.error('Weak Password', 'Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Password Mismatch', 'Passwords do not match');
            return;
        }

        const result = await register(username, password);

        if (result.success) {
            toast.success('Account Created!', 'Your encryption keys have been generated');
        } else {
            toast.error('Registration Failed', result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 cyber-bg">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
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
                        <h1 className="text-2xl font-bold text-dark-100">Create Account</h1>
                        <p className="text-dark-400 mt-1">Join CipherLink for secure messaging</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Choose a username"
                                    icon={User}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                    autoComplete="username"
                                    className="pr-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {usernameStatus.checking ? (
                                        <Loader2 className="w-5 h-5 text-dark-400 animate-spin" />
                                    ) : usernameStatus.available === true ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : usernameStatus.available === false ? (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    ) : null}
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-dark-500">
                                2-20 characters: letters, numbers, underscores
                            </p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a strong password"
                                    icon={Lock}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
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

                            {/* Password strength indicator */}
                            {password && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded-full transition-colors ${level <= passwordStrength.score
                                                        ? `bg-${passwordStrength.color}`
                                                        : 'bg-dark-700'
                                                    }`}
                                                style={{
                                                    backgroundColor: level <= passwordStrength.score
                                                        ? (passwordStrength.score <= 2 ? '#ef4444' : passwordStrength.score <= 4 ? '#eab308' : '#22c55e')
                                                        : undefined
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs text-${passwordStrength.color}`}>
                                        {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    icon={Lock}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    className="pr-10"
                                />
                                {confirmPassword && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {passwordsMatch ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Security notice */}
                        <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-700/50">
                            <div className="flex items-start gap-2">
                                <Shield className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-dark-400">
                                    <span className="text-dark-300 font-medium">Key Generation: </span>
                                    We'll create your unique ECDH-P521 encryption keys. Your private key is encrypted with your password and never leaves your device unprotected.
                                </p>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <span>{isLoading ? 'Generating Keys...' : 'Create Account'}</span>
                            {!isLoading && <ArrowRight className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-dark-700/50 text-center">
                        <p className="text-dark-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                                Sign In
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
                    <span className="text-xs">PBKDF2 (75,000 iterations) + ECDH-P521 + AES-256-GCM</span>
                </motion.div>
            </motion.div>
        </div>
    );
}
