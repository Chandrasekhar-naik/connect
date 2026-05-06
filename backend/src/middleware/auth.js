import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import logger from '../config/logger.js';
const jwtExpire = (process.env.JWT_EXPIRE || '7d');
const jwtRefreshExpire = (process.env.JWT_REFRESH_EXPIRE || '30d');
export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ success: false, message: 'No authentication token provided' });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: 'Token expired' });
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: 'Invalid token' });
        }
        else {
            logger.error('Auth middleware error:', error);
            res.status(500).json({ success: false, message: 'Authentication failed' });
        }
    }
};
export const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: jwtExpire
    });
};
export const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: jwtRefreshExpire
    });
};
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
    catch (error) {
        throw new Error('Invalid token');
    }
};
export const optional = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = user;
                req.token = token;
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
