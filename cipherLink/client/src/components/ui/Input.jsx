import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({
    className,
    type = 'text',
    error,
    icon: Icon,
    ...props
}, ref) => {
    return (
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <input
                type={type}
                className={cn(
                    'input-base',
                    Icon && 'pl-11',
                    error && 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50',
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-400">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
