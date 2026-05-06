import { body, validationResult, param, query } from 'express-validator';
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: 'path' in err ? err.path : 'unknown',
                message: err.msg
            }))
        });
        return;
    }
    next();
};
// Auth validation
export const validateSignup = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').optional().trim(),
    handleValidationErrors
];
export const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];
// Chat validation
export const validateCreateChat = [
    body('other_user_id').isMongoId().withMessage('Invalid user ID'),
    handleValidationErrors
];
export const validateCreateGroupChat = [
    body('name').trim().notEmpty().withMessage('Chat name is required'),
    body('member_ids').isArray().withMessage('Member IDs must be an array'),
    handleValidationErrors
];
export const validateUpdateChat = [
    param('chatId').isMongoId().withMessage('Invalid chat ID'),
    body('name').optional().trim(),
    handleValidationErrors
];
// Message validation
export const validateSendMessage = [
    body('chat_id').isMongoId().withMessage('Invalid chat ID'),
    body('content').trim().notEmpty().withMessage('Message content is required'),
    body('type').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type'),
    handleValidationErrors
];
export const validateGetMessages = [
    param('chat_id').isMongoId().withMessage('Invalid chat ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
    handleValidationErrors
];
export const validateMarkAsRead = [
    body('message_id').isMongoId().withMessage('Invalid message ID'),
    handleValidationErrors
];
// Profile validation
export const validateUpdateProfile = [
    body('name').optional().trim(),
    body('phone').optional().trim(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
];
