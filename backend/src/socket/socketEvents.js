import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { TypingStatus } from '../models/TypingStatus.js';
import { ChatMember } from '../models/ChatMember.js';
import logger from '../config/logger.js';
import messageService from '../services/messageService.js';
export const setupSocketIO = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('No authentication token provided'));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            await User.findByIdAndUpdate(decoded.userId, {
                status: 'online',
                lastSeen: new Date()
            });
            next();
        }
        catch (error) {
            logger.error('Socket auth error:', error);
            next(new Error('Authentication failed'));
        }
    });
    io.on('connection', (socket) => {
        logger.info(`User ${socket.userId} connected. Socket ID: ${socket.id}`);
        io.emit('user-presence-update', {
            userId: socket.userId,
            status: 'online',
            lastSeen: new Date()
        });
        socket.on('join-chat', async (chatId) => {
            try {
                const isMember = await ChatMember.findOne({
                    chat_id: chatId,
                    user_id: socket.userId
                });
                if (!isMember) {
                    socket.emit('error', { message: 'You are not a member of this chat' });
                    return;
                }
                socket.join(`chat-${chatId}`);
                socket.to(`chat-${chatId}`).emit('user-joined', {
                    userId: socket.userId,
                    timestamp: new Date()
                });
            }
            catch (error) {
                logger.error('Error joining chat:', error);
                socket.emit('error', { message: 'Failed to join chat' });
            }
        });
        socket.on('leave-chat', async (chatId) => {
            try {
                socket.leave(`chat-${chatId}`);
                await TypingStatus.deleteOne({
                    chat_id: chatId,
                    user_id: socket.userId
                });
                socket.to(`chat-${chatId}`).emit('user-left', {
                    userId: socket.userId,
                    timestamp: new Date()
                });
            }
            catch (error) {
                logger.error('Error leaving chat:', error);
            }
        });
        socket.on('send-message', async (data) => {
            try {
                const { chatId, content, type = 'text', file_url, file_name, file_size } = data;
                if (!chatId || !content || !socket.userId) {
                    socket.emit('error', { message: 'Missing required fields' });
                    return;
                }
                const message = await messageService.sendMessage(chatId, socket.userId, content, type, file_url, file_name, file_size);
                await TypingStatus.deleteOne({
                    chat_id: chatId,
                    user_id: socket.userId
                });
                io.to(`chat-${chatId}`).emit('new-message', {
                    id: message._id,
                    chat_id: chatId,
                    content: message.content,
                    type: message.type,
                    sender_id: message.sender_id._id,
                    sender_name: message.sender_id.name,
                    sender_avatar: message.sender_id.avatar_url,
                    file_url: message.file_url,
                    file_name: message.file_name,
                    file_size: message.file_size,
                    createdAt: message.createdAt
                });
            }
            catch (error) {
                logger.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        socket.on('start-typing', async (chatId) => {
            try {
                const isMember = await ChatMember.findOne({
                    chat_id: chatId,
                    user_id: socket.userId
                });
                if (!isMember)
                    return;
                await TypingStatus.findOneAndUpdate({ chat_id: chatId, user_id: socket.userId }, { updated_at: new Date() }, { upsert: true });
                socket.to(`chat-${chatId}`).emit('user-typing', {
                    userId: socket.userId,
                    chatId
                });
            }
            catch (error) {
                logger.error('Error setting typing status:', error);
            }
        });
        socket.on('stop-typing', async (chatId) => {
            try {
                await TypingStatus.deleteOne({
                    chat_id: chatId,
                    user_id: socket.userId
                });
                socket.to(`chat-${chatId}`).emit('user-stopped-typing', {
                    userId: socket.userId,
                    chatId
                });
            }
            catch (error) {
                logger.error('Error clearing typing status:', error);
            }
        });
        socket.on('message-read', async (data) => {
            try {
                const { messageId, chatId } = data;
                if (!messageId)
                    return;
                socket.to(`chat-${chatId}`).emit('message-read-update', {
                    messageId,
                    userId: socket.userId,
                    readAt: new Date()
                });
            }
            catch (error) {
                logger.error('Error marking message as read:', error);
            }
        });
        socket.on('user-presence', async (status) => {
            try {
                await User.findByIdAndUpdate(socket.userId, {
                    status,
                    lastSeen: new Date()
                });
                io.emit('user-presence-update', {
                    userId: socket.userId,
                    status,
                    lastSeen: new Date()
                });
            }
            catch (error) {
                logger.error('Error updating user presence:', error);
            }
        });
        socket.on('disconnect', async () => {
            try {
                await User.findByIdAndUpdate(socket.userId, {
                    status: 'offline',
                    lastSeen: new Date()
                });
                io.emit('user-offline', {
                    userId: socket.userId,
                    lastSeen: new Date()
                });
            }
            catch (error) {
                logger.error('Error on disconnect:', error);
            }
        });
    });
};
export default setupSocketIO;
