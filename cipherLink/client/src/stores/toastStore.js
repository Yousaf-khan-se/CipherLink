import { create } from 'zustand';

export const useToastStore = create((set, get) => ({
    toasts: [],

    /**
     * Add a toast notification
     */
    addToast: (toast) => {
        const id = Date.now();
        const newToast = {
            id,
            type: toast.type || 'info',
            title: toast.title,
            message: toast.message,
            duration: toast.duration || 5000
        };

        set((state) => ({
            toasts: [...state.toasts, newToast]
        }));

        // Auto remove after duration
        if (newToast.duration > 0) {
            setTimeout(() => {
                get().removeToast(id);
            }, newToast.duration);
        }

        return id;
    },

    /**
     * Remove a toast by ID
     */
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    },

    /**
     * Clear all toasts
     */
    clearToasts: () => {
        set({ toasts: [] });
    },

    // Convenience methods
    success: (title, message) => get().addToast({ type: 'success', title, message }),
    error: (title, message) => get().addToast({ type: 'error', title, message }),
    warning: (title, message) => get().addToast({ type: 'warning', title, message }),
    info: (title, message) => get().addToast({ type: 'info', title, message })
}));

// Export convenience function
export const toast = {
    success: (title, message) => useToastStore.getState().success(title, message),
    error: (title, message) => useToastStore.getState().error(title, message),
    warning: (title, message) => useToastStore.getState().warning(title, message),
    info: (title, message) => useToastStore.getState().info(title, message)
};
