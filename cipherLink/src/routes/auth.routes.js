import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import User, { validateRegistration, validateLogin } from '../models/User.model.js';
import { generateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Strict rate limiter for login and register only
const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
        error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// PBKDF2 configuration - server side
const PBKDF2_ITERATIONS = 50000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

/**
 * Hash password with PBKDF2 (server-side)
 * Client already does 25,000 iterations, server adds 50,000 more
 */
const hashPassword = async (clientAuth, salt) => {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(
            clientAuth,
            salt,
            PBKDF2_ITERATIONS,
            PBKDF2_KEYLEN,
            PBKDF2_DIGEST,
            (err, derivedKey) => {
                if (err) reject(err);
                resolve(derivedKey.toString('hex'));
            }
        );
    });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', strictAuthLimiter, async (req, res) => {
    try {
        // Validate request body
        const { error } = validateRegistration(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { username, auth, publicKey, publicKeyHash, privateKeyCipher, keySalt } = req.body;

        // Check if username already exists (case-insensitive)
        const existingUser = await User.findOne({
            username: username.toLowerCase()
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Generate random salt for server-side hashing
        const salt = await bcrypt.genSalt(12);

        // Hash the client auth with server-side PBKDF2
        const serverAuth = await hashPassword(auth, salt);

        // Create new user
        const user = new User({
            username: username.toLowerCase(),
            auth: serverAuth,
            salt,
            keySalt,
            publicKey,
            publicKeyHash,
            privateKeyCipher
        });

        await user.save();

        // Generate JWT token
        const token = generateToken({
            _id: user._id,
            username: user.username,
            publicKeyHash: user.publicKeyHash
        });

        // Return user data and token
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                _id: user._id,
                username: user.username,
                bio: user.bio,
                publicKey: user.publicKey,
                publicKeyHash: user.publicKeyHash,
                privateKeyCipher: user.privateKeyCipher,
                keySalt: user.keySalt
            }
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', strictAuthLimiter, async (req, res) => {
    try {
        // Validate request body
        const { error } = validateLogin(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { username, auth } = req.body;

        // Find user by username (case-insensitive)
        const user = await User.findOne({
            username: username.toLowerCase()
        });

        if (!user) {
            // Use generic message to prevent username enumeration
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Hash the provided auth with user's salt
        const hashedAuth = await hashPassword(auth, user.salt);

        // Compare hashes using timing-safe comparison
        const isMatch = crypto.timingSafeEqual(
            Buffer.from(hashedAuth, 'hex'),
            Buffer.from(user.auth, 'hex')
        );

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken({
            _id: user._id,
            username: user.username,
            publicKeyHash: user.publicKeyHash
        });

        // Return user data and token
        res.json({
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                username: user.username,
                bio: user.bio,
                publicKey: user.publicKey,
                publicKeyHash: user.publicKeyHash,
                privateKeyCipher: user.privateKeyCipher,
                keySalt: user.keySalt
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

/**
 * @route   GET /api/auth/check-username/:username
 * @desc    Check if username is available
 * @access  Public
 */
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const existingUser = await User.findOne({
            username: username.toLowerCase()
        });

        res.json({
            available: !existingUser,
            username: username.toLowerCase()
        });
    } catch (err) {
        console.error('Username check error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
