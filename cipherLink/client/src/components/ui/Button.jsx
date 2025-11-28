import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export const Button = forwardRef(({
    className,
    variant = 'primary',
    size = 'default',
    isLoading = false,
    disabled,
    children,
    ...props
}, ref) => {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        danger: 'px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-all duration-200'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        default: '',
        lg: 'px-8 py-4 text-lg'
    };

    return (
        <button
            className={cn(
                variants[variant],
                sizes[size],
                isLoading && 'opacity-70 cursor-wait',
                className
            )}
            disabled={disabled || isLoading}
            ref={ref}
            {...props}
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                </span>
            ) : (
                children
            )}
        </button>
    );
});

Button.displayName = 'Button';
