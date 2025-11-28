import { Shield, Lock, Zap } from 'lucide-react';

export function Logo({ size = 'default', showText = true }) {
    const sizes = {
        sm: 'w-8 h-8',
        default: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const textSizes = {
        sm: 'text-lg',
        default: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl'
    };

    return (
        <div className="flex items-center gap-3">
            <div className={`relative ${sizes[size]}`}>
                {/* Shield background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-cyan rounded-lg opacity-20" />

                {/* Shield icon */}
                <div className="relative w-full h-full flex items-center justify-center">
                    <Shield className="w-3/4 h-3/4 text-primary-500" strokeWidth={1.5} />
                    <Lock className="absolute w-1/3 h-1/3 text-accent-cyan" strokeWidth={2} />
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-lg bg-primary-500/20 blur-lg -z-10" />
            </div>

            {showText && (
                <div className="flex flex-col">
                    <span className={`font-bold gradient-text ${textSizes[size]}`}>
                        CipherLink
                    </span>
                    <span className="text-[10px] text-dark-400 tracking-wider uppercase">
                        End-to-End Encrypted
                    </span>
                </div>
            )}
        </div>
    );
}

export function LogoIcon({ className = 'w-8 h-8' }) {
    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-cyan rounded-lg opacity-20" />
            <div className="relative w-full h-full flex items-center justify-center">
                <Shield className="w-3/4 h-3/4 text-primary-500" strokeWidth={1.5} />
                <Lock className="absolute w-1/3 h-1/3 text-accent-cyan" strokeWidth={2} />
            </div>
        </div>
    );
}
