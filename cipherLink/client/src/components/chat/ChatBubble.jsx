import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, CheckCheck } from 'lucide-react';
import { formatMessageTime, cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

export function ChatBubble({ message, isOwn, showSender, isEncrypted }) {
    const [showTime, setShowTime] = useState(false);

    // Handle decryption status
    const isDecrypted = message.decrypted !== false;
    const hasError = message.decryptionError;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'flex items-end gap-2',
                isOwn ? 'flex-row-reverse' : 'flex-row'
            )}
        >
            {/* Avatar for received messages with sender name */}
            {showSender && !isOwn && (
                <Avatar username={message.senderName} size="sm" />
            )}

            <div
                className={cn(
                    'max-w-[75%] min-w-[80px]',
                    isOwn ? 'items-end' : 'items-start'
                )}
            >
                {/* Sender name */}
                {showSender && !isOwn && (
                    <p className="text-xs text-dark-400 mb-1 ml-1 font-medium">
                        {message.senderName}
                    </p>
                )}

                {/* Message bubble */}
                <div
                    onClick={() => setShowTime(!showTime)}
                    className={cn(
                        'relative px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-200',
                        isOwn
                            ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-br-md'
                            : 'bg-dark-700/80 text-dark-100 rounded-bl-md',
                        isEncrypted && 'border border-primary-500/20',
                        hasError && 'border-red-500/50 bg-red-500/10'
                    )}
                >
                    {/* Encryption indicator */}
                    {isEncrypted && isDecrypted && (
                        <div className={cn(
                            'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center',
                            'bg-primary-500 text-white'
                        )}>
                            <Lock className="w-2.5 h-2.5" />
                        </div>
                    )}

                    {/* Message content */}
                    {hasError ? (
                        <div className="flex items-center gap-2 text-red-400">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm">Unable to decrypt</span>
                        </div>
                    ) : !isDecrypted && isEncrypted ? (
                        <div className="flex items-center gap-2 text-dark-400">
                            <Lock className="w-4 h-4 animate-pulse" />
                            <span className="text-sm">Decrypting...</span>
                        </div>
                    ) : (
                        <p className="text-sm break-words whitespace-pre-wrap">
                            {message.message}
                        </p>
                    )}

                    {/* Read status for own messages */}
                    {isOwn && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                            {message.seen ? (
                                <CheckCheck className="w-3.5 h-3.5 text-primary-300" />
                            ) : (
                                <Check className="w-3.5 h-3.5 text-primary-300/50" />
                            )}
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                <motion.div
                    initial={false}
                    animate={{
                        height: showTime ? 'auto' : 0,
                        opacity: showTime ? 1 : 0
                    }}
                    className="overflow-hidden"
                >
                    <p className={cn(
                        'text-[10px] text-dark-500 mt-1',
                        isOwn ? 'text-right mr-1' : 'ml-1'
                    )}>
                        {formatMessageTime(message.timestamp || message.serverTimestamp)}
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}
