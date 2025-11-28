import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) {
        return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    }

    return then.toLocaleDateString();
}

/**
 * Format time for chat messages
 */
export function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    if (isToday) {
        return time;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isYesterday) {
        return `Yesterday ${time}`;
    }

    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate avatar initials from username
 */
export function getInitials(name) {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
}

/**
 * Generate a consistent color from a string (for avatars)
 */
export function stringToColor(str) {
    if (!str) return 'hsl(0, 70%, 50%)';

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;
    return `hsl(${hue}, 70%, 45%)`;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Validate username format
 */
export function isValidUsername(username) {
    const regex = /^[a-zA-Z0-9_]{2,20}$/;
    return regex.test(username);
}

/**
 * Validate password strength
 */
export function getPasswordStrength(password) {
    if (!password) return { score: 0, label: 'Too weak', color: 'red' };

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
        { score: 0, label: 'Too weak', color: 'red-500' },
        { score: 1, label: 'Weak', color: 'red-400' },
        { score: 2, label: 'Fair', color: 'yellow-500' },
        { score: 3, label: 'Good', color: 'yellow-400' },
        { score: 4, label: 'Strong', color: 'green-400' },
        { score: 5, label: 'Very strong', color: 'green-500' },
        { score: 6, label: 'Excellent', color: 'primary-500' }
    ];

    return levels[Math.min(score, levels.length - 1)];
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            return true;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

/**
 * Local storage helpers with JSON parsing
 */
export const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch {
            return false;
        }
    }
};

/**
 * Secure storage for sensitive data (uses sessionStorage)
 */
export const secureStorage = {
    get(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },

    remove(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    }
};
