import mongoose from 'mongoose';
import Joi from 'joi';

const chatSchema = new mongoose.Schema({
    // Sender's username (encrypted for private chats)
    senderName: {
        type: String,
        required: true
    },
    // Message content (encrypted for private chats)
    message: {
        type: String,
        required: true,
        maxlength: 2000
    },
    // Channel identifier: "global" or hash of sorted public keys
    channel: {
        type: String,
        required: true,
        index: true
    },
    // Timestamp (encrypted for private chats, ISO string)
    timestamp: {
        type: String,
        required: true
    },
    // SHA-256 hash of sender's public key
    senderPublicKeyHash: {
        type: String,
        index: true
    },
    // SHA-256 hash of receiver's public key (null for global)
    receiverPublicKeyHash: {
        type: String,
        index: true
    },
    // Message type: 'text', 'system', 'encrypted'
    messageType: {
        type: String,
        enum: ['text', 'system', 'encrypted'],
        default: 'text'
    },
    // Read receipt for private messages
    seen: {
        type: Boolean,
        default: false
    },
    // Server timestamp for ordering
    serverTimestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for efficient channel queries
chatSchema.index({ channel: 1, serverTimestamp: -1 });
chatSchema.index({ senderPublicKeyHash: 1, receiverPublicKeyHash: 1 });

// Static method to get channel messages with pagination
chatSchema.statics.getChannelMessages = async function (channel, limit = 50, before = null) {
    const query = { channel };

    if (before) {
        query.serverTimestamp = { $lt: new Date(before) };
    }

    return this.find(query)
        .sort({ serverTimestamp: -1 })
        .limit(limit)
        .lean();
};

// Static method to get user's private channels
chatSchema.statics.getUserChannels = async function (publicKeyHash) {
    const channels = await this.aggregate([
        {
            $match: {
                $or: [
                    { senderPublicKeyHash: publicKeyHash },
                    { receiverPublicKeyHash: publicKeyHash }
                ],
                channel: { $ne: 'global' }
            }
        },
        {
            $group: {
                _id: '$channel',
                lastMessage: { $last: '$$ROOT' },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$receiverPublicKeyHash', publicKeyHash] },
                                    { $eq: ['$seen', false] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $sort: { 'lastMessage.serverTimestamp': -1 }
        }
    ]);

    return channels;
};

// Joi validation for new message
export const validateMessage = (data) => {
    const schema = Joi.object({
        senderName: Joi.string().required(),
        message: Joi.string().min(1).max(2000).required(),
        channel: Joi.string().required(),
        timestamp: Joi.string().required(),
        senderPublicKeyHash: Joi.string().allow(null, ''),
        receiverPublicKeyHash: Joi.string().allow(null, ''),
        messageType: Joi.string().valid('text', 'system', 'encrypted').default('text')
    });

    return schema.validate(data);
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
