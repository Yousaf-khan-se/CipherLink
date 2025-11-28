import mongoose from 'mongoose';
import Joi from 'joi';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 20,
        lowercase: true
    },
    bio: {
        type: String,
        maxlength: 100,
        default: 'A new CipherLink user...'
    },
    auth: {
        type: String, // PBKDF2 hashed password (server-side)
        required: true
    },
    salt: {
        type: String, // Random salt for password hashing (server-side)
        required: true
    },
    // Salt used for private key encryption (client-generated)
    keySalt: {
        type: String
    },
    // Encrypted ECDH private key (encrypted with user's passphrase)
    privateKeyCipher: {
        type: String
    },
    // ECDH public key (JSON stringified)
    publicKey: {
        type: String
    },
    // SHA-256 hash of public key (for efficient lookups)
    publicKeyHash: {
        type: String,
        index: true
    },
    // Socket.id when online, empty when offline
    status: {
        type: String,
        default: ''
    },
    // Last seen timestamp
    lastSeen: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries (username already indexed via unique: true)
userSchema.index({ status: 1 });

// Don't return sensitive fields in JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.auth;
    delete user.salt;
    delete user.privateKeyCipher;
    delete user.__v;
    return user;
};

// Get public profile (safe to share)
userSchema.methods.toPublicProfile = function () {
    return {
        _id: this._id,
        username: this.username,
        bio: this.bio,
        publicKey: this.publicKey,
        publicKeyHash: this.publicKeyHash,
        status: this.status ? 'online' : 'offline',
        lastSeen: this.lastSeen
    };
};

// Joi validation for registration
export const validateRegistration = (data) => {
    const schema = Joi.object({
        username: Joi.string()
            .min(2)
            .max(20)
            .pattern(/^[a-zA-Z0-9_]+$/)
            .required()
            .messages({
                'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
                'string.min': 'Username must be at least 2 characters',
                'string.max': 'Username cannot exceed 20 characters'
            }),
        auth: Joi.string().required(), // Client-side hashed password
        publicKey: Joi.string().required(),
        publicKeyHash: Joi.string().required(),
        privateKeyCipher: Joi.string().required(),
        keySalt: Joi.string().required() // Salt for private key encryption
    });

    return schema.validate(data);
};

// Joi validation for login
export const validateLogin = (data) => {
    const schema = Joi.object({
        username: Joi.string().required(),
        auth: Joi.string().required()
    });

    return schema.validate(data);
};

// Joi validation for profile update
export const validateProfileUpdate = (data) => {
    const schema = Joi.object({
        bio: Joi.string().max(100).allow('')
    });

    return schema.validate(data);
};

const User = mongoose.model('User', userSchema);

export default User;
