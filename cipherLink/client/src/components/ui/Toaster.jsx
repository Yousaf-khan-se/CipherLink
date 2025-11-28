import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../stores/toastStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
};

const colors = {
    success: 'bg-green-500/20 border-green-500/50 text-green-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-400'
};

export function Toaster() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = icons[toast.type] || Info;
                    const colorClass = colors[toast.type] || colors.info;

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-xl ${colorClass}`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                {toast.title && (
                                    <p className="font-medium text-sm">{toast.title}</p>
                                )}
                                {toast.message && (
                                    <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
