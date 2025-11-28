import jwt from 'jsonwebtoken';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const auth = (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(401).json({ error: 'Token verification failed' });
    }
};

/**
 * Optional auth middleware
 * Attaches user info if token is valid, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        // Token invalid, but that's okay for optional auth
    }

    next();
};

/**
 * Generate JWT token
 */
export const generateToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

export default auth;
