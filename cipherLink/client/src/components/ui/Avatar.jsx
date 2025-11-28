import { cn, getInitials, stringToColor } from '../../lib/utils';

export function Avatar({
    username,
    size = 'md',
    isOnline,
    className
}) {
    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl'
    };

    const statusSizes = {
        xs: 'w-2 h-2',
        sm: 'w-2.5 h-2.5',
        md: 'w-3 h-3',
        lg: 'w-3.5 h-3.5',
        xl: 'w-4 h-4'
    };

    const backgroundColor = stringToColor(username);

    return (
        <div className={cn('relative inline-flex', className)}>
            <div
                className={cn(
                    'flex items-center justify-center rounded-full font-semibold text-white',
                    sizes[size]
                )}
                style={{ backgroundColor }}
            >
                {getInitials(username)}
            </div>
            {isOnline !== undefined && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 rounded-full border-2 border-dark-900',
                        statusSizes[size],
                        isOnline ? 'bg-green-500' : 'bg-dark-500'
                    )}
                />
            )}
        </div>
    );
}
