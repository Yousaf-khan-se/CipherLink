import express from 'express';
import Chat, { validateMessage } from '../models/Chat.model.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Message limits per channel
const GLOBAL_MESSAGE_LIMIT = 100;
const PRIVATE_MESSAGE_LIMIT = 500;

/**
 * @route   GET /api/chats/channels/private
 * @desc    Get user's private channels with last message
 * @access  Private
 * @note    This route MUST come before /:channel to prevent path conflict
 */
router.get('/channels/private', auth, async (req, res) => {
    try {
        const { publicKeyHash } = req.user;

        if (!publicKeyHash) {
            return res.status(400).json({ error: 'Public key hash required' });
        }

        const channels = await Chat.getUserChannels(publicKeyHash);
        res.json(channels);
    } catch (err) {
        console.error('Get private channels error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/chats/:channel
 * @desc    Get messages for a channel
 * @access  Private
 */
router.get('/:channel', auth, async (req, res) => {
    try {
        const { channel } = req.params;
        const { limit = 50, before } = req.query;

        const messages = await Chat.getChannelMessages(
            channel,
            Math.min(parseInt(limit), 100),
            before
        );

        // Return in chronological order
        res.json(messages.reverse());
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   POST /api/chats
 * @desc    Send a new message
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    try {
        const { error } = validateMessage(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            senderName,
            message,
            channel,
            timestamp,
            senderPublicKeyHash,
            receiverPublicKeyHash,
            messageType = 'text'
        } = req.body;

        // Verify sender is the authenticated user (prevent message spoofing)
        if (senderPublicKeyHash && senderPublicKeyHash !== req.user.publicKeyHash) {
            return res.status(403).json({ error: 'Sender verification failed' });
        }

        // Create new message using authenticated user's info
        const chat = new Chat({
            senderName,
            message,
            channel,
            timestamp,
            senderPublicKeyHash: req.user.publicKeyHash || senderPublicKeyHash,
            receiverPublicKeyHash,
            messageType,
            serverTimestamp: new Date()
        });

        await chat.save();

        // Clean up old messages to maintain limits
        const messageLimit = channel === 'global' ? GLOBAL_MESSAGE_LIMIT : PRIVATE_MESSAGE_LIMIT;

        const messageCount = await Chat.countDocuments({ channel });

        if (messageCount > messageLimit) {
            const messagesToDelete = await Chat.find({ channel })
                .sort({ serverTimestamp: 1 })
                .limit(messageCount - messageLimit)
                .select('_id');

            await Chat.deleteMany({
                _id: { $in: messagesToDelete.map(m => m._id) }
            });
        }

        res.status(201).json(chat);
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/chats/:messageId/seen
 * @desc    Mark message as seen
 * @access  Private
 */
router.put('/:messageId/seen', auth, async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Chat.findByIdAndUpdate(
            messageId,
            { seen: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json(message);
    } catch (err) {
        console.error('Mark seen error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/chats/channel/:channel/seen
 * @desc    Mark all messages in channel as seen
 * @access  Private
 */
router.put('/channel/:channel/seen', auth, async (req, res) => {
    try {
        const { channel } = req.params;
        const { publicKeyHash } = req.user;

        await Chat.updateMany(
            {
                channel,
                receiverPublicKeyHash: publicKeyHash,
                seen: false
            },
            { seen: true }
        );

        res.json({ message: 'Messages marked as seen' });
    } catch (err) {
        console.error('Mark channel seen error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   DELETE /api/chats/:messageId
 * @desc    Delete a message (only sender can delete)
 * @access  Private
 */
router.delete('/:messageId', auth, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { publicKeyHash } = req.user;

        const message = await Chat.findOne({
            _id: messageId,
            senderPublicKeyHash: publicKeyHash
        });

        if (!message) {
            return res.status(404).json({ error: 'Message not found or unauthorized' });
        }

        await message.deleteOne();

        res.json({ message: 'Message deleted' });
    } catch (err) {
        console.error('Delete message error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
