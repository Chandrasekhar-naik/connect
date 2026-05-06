import logger from '../config/logger.js';
export class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
export const errorHandler = (error, req, res, next) => {
    if (error instanceof AppError) {
        logger.warn(`${error.statusCode}: ${error.message}`);
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            statusCode: error.statusCode
        });
        return;
    }
    // Mongoose validation error
    if (error.name === 'ValidationError') {
        const messages = Object.values(error).map((err) => err.message);
        res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: messages
        });
        return;
    }
    // Mongoose duplicate key error
    if (error.name === 'MongoServerError' && error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        res.status(409).json({
            success: false,
            message: `${field} already exists`
        });
        return;
    }
    logger.error('Unhandled Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
};
// Async error wrapper
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
