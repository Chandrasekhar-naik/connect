import messageService from '../services/messageService.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
export const sendMessage = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { chat_id, content, type = 'text' } = req.body;
    if (!chat_id || !content) {
        throw new AppError(400, 'chat_id and content are required');
    }
    const message = await messageService.sendMessage(chat_id, req.user._id.toString(), content, type, req.body.file_url, req.body.file_name, req.body.file_size);
    res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: {
            id: message._id,
            content: message.content,
            type: message.type,
            sender_id: message.sender_id._id,
            sender_name: message.sender_id.name,
            file_url: message.file_url,
            file_name: message.file_name,
            file_size: message.file_size,
            createdAt: message.createdAt
        }
    });
});
export const uploadAttachment = catchAsync(async (req, res) => {
    if (!req.user || !req.file) {
        throw new AppError(400, 'No file uploaded');
    }
    const result = await uploadToCloudinary(req.file.path, {
        folder: 'pulse-chat/attachments',
        public_id: `attachment-${req.user._id}-${Date.now()}`,
        resource_type: 'auto'
    });
    res.status(201).json({
        success: true,
        file: {
            url: result.secure_url,
            name: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        }
    });
});
export const getMessages = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { chat_id } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const messages = await messageService.getMessages(chat_id, req.user._id.toString(), parseInt(limit), parseInt(skip));
    res.json({
        success: true,
        count: messages.length,
        messages: messages.map(msg => ({
            id: msg._id,
            content: msg.content,
            type: msg.type,
            sender_id: msg.sender_id._id,
            sender_name: msg.sender_id.name,
            sender_avatar: msg.sender_id.avatar_url,
            file_url: msg.file_url,
            file_name: msg.file_name,
            edited: msg.edited,
            editedAt: msg.editedAt,
            createdAt: msg.createdAt
        }))
    });
});
export const markAsRead = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { message_id } = req.body;
    await messageService.markAsRead(message_id, req.user._id.toString());
    res.json({
        success: true,
        message: 'Message marked as read'
    });
});
export const markChatAsRead = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { chat_id } = req.params;
    await messageService.markChatAsRead(chat_id, req.user._id.toString());
    res.json({
        success: true,
        message: 'Chat marked as read'
    });
});
export const getMessageReads = catchAsync(async (req, res) => {
    const { message_id } = req.params;
    const reads = await messageService.getMessageReads(message_id);
    res.json({
        success: true,
        count: reads.length,
        reads: reads.map(r => ({
            userId: r.userId,
            readAt: r.readAt
        }))
    });
});
export const editMessage = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { message_id } = req.params;
    const { content } = req.body;
    if (!content) {
        throw new AppError(400, 'Content is required');
    }
    const message = await messageService.editMessage(message_id, req.user._id.toString(), content);
    res.json({
        success: true,
        message: 'Message updated successfully',
        data: {
            id: message._id,
            content: message.content,
            edited: message.edited,
            editedAt: message.editedAt
        }
    });
});
export const deleteMessage = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { message_id } = req.params;
    await messageService.deleteMessage(message_id, req.user._id.toString());
    res.json({
        success: true,
        message: 'Message deleted successfully'
    });
});
export const searchMessages = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { chat_id } = req.params;
    const { query, limit = 20 } = req.query;
    if (!query) {
        throw new AppError(400, 'Search query is required');
    }
    const messages = await messageService.searchMessages(chat_id, req.user._id.toString(), query, parseInt(limit));
    res.json({
        success: true,
        count: messages.length,
        messages: messages.map(msg => ({
            id: msg._id,
            content: msg.content,
            sender_name: msg.sender_id.name,
            createdAt: msg.createdAt
        }))
    });
});
export const addReaction = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { message_id } = req.params;
    const { emoji } = req.body;
    if (!emoji) {
        throw new AppError(400, 'Emoji is required');
    }
    const message = await messageService.addReaction(message_id, req.user._id.toString(), emoji);
    res.json({
        success: true,
        message: 'Reaction added',
        reactions: message.reactions
    });
});
export const removeReaction = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { message_id } = req.params;
    const { emoji } = req.body;
    if (!emoji) {
        throw new AppError(400, 'Emoji is required');
    }
    const message = await messageService.removeReaction(message_id, req.user._id.toString(), emoji);
    res.json({
        success: true,
        message: 'Reaction removed',
        reactions: message.reactions
    });
});
export default {
    sendMessage,
    uploadAttachment,
    getMessages,
    markAsRead,
    markChatAsRead,
    getMessageReads,
    editMessage,
    deleteMessage,
    searchMessages,
    addReaction,
    removeReaction
};
