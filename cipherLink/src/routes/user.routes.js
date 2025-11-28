import express from 'express';
import User, { validateProfileUpdate } from '../models/User.model.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            bio: user.bio,
            publicKey: user.publicKey,
            publicKeyHash: user.publicKeyHash,
            status: user.status,
            lastSeen: user.lastSeen,
            createdAt: user.createdAt
        });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/users/online
 * @desc    Get list of online users
 * @access  Private
 */
router.get('/online', auth, async (req, res) => {
    try {
        const onlineUsers = await User.find({
            status: { $ne: '' },
            _id: { $ne: req.user._id }
        })
            .select('username bio publicKey publicKeyHash status lastSeen')
            .limit(50)
            .lean();

        res.json(onlineUsers);
    } catch (err) {
        console.error('Get online users error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/users/all
 * @desc    Get all users (paginated)
 * @access  Private
 */
router.get('/all', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const skip = (page - 1) * limit;

        const users = await User.find({ _id: { $ne: req.user._id } })
            .select('username bio publicKey publicKeyHash status lastSeen')
            .sort({ status: -1, lastSeen: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await User.countDocuments({ _id: { $ne: req.user._id } });

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/users/search
 * @desc    Search users by username
 * @access  Private
 */
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 1) {
            return res.json([]);
        }

        const users = await User.find({
            username: { $regex: q, $options: 'i' },
            _id: { $ne: req.user._id }
        })
            .select('username bio publicKey publicKeyHash status lastSeen')
            .limit(20)
            .lean();

        res.json(users);
    } catch (err) {
        console.error('Search users error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   GET /api/users/:publicKeyHash
 * @desc    Get user by public key hash
 * @access  Private
 */
router.get('/by-hash/:publicKeyHash', auth, async (req, res) => {
    try {
        const user = await User.findOne({
            publicKeyHash: req.params.publicKeyHash
        })
            .select('username bio publicKey publicKeyHash status lastSeen')
            .lean();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Get user by hash error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', auth, async (req, res) => {
    try {
        const { error } = validateProfileUpdate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { bio } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { bio },
            { new: true }
        ).select('username bio publicKey publicKeyHash status lastSeen');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   PUT /api/users/status
 * @desc    Update user online status
 * @access  Private
 */
router.put('/status', auth, async (req, res) => {
    try {
        const { status, socketId } = req.body;

        const updateData = {
            status: status === 'online' ? socketId || 'online' : '',
            lastSeen: new Date()
        };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        ).select('username status lastSeen');

        res.json(user);
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route   DELETE /api/users/me
 * @desc    Delete current user account
 * @access  Private
 */
router.delete('/me', auth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
