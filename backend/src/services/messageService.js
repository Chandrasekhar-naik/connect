import { Message } from '../models/Message.js';
import { MessageRead } from '../models/MessageRead.js';
import { Chat } from '../models/Chat.js';
import { AppError } from '../middleware/errorHandler.js';
import chatService from './chatService.js';
import mongoose from 'mongoose';
export class MessageService {
    async sendMessage(chatId, senderId, content, type = 'text', fileUrl, fileName, fileSize) {
        // Verify user is chat member
        const isMember = await chatService.isMember(chatId, senderId);
        if (!isMember) {
            throw new AppError(403, 'You are not a member of this chat');
        }
        const message = new Message({
            chat_id: chatId,
            sender_id: senderId,
            content,
            type,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize
        });
        await message.save();
        await message.populate('sender_id', 'name avatar_url email');
        // Update last message in chat
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: content,
            lastMessageTime: new Date()
        });
        return message;
    }
    async getMessages(chatId, userId, limit = 50, skip = 0) {
        // Verify user is chat member
        const isMember = await chatService.isMember(chatId, userId);
        if (!isMember) {
            throw new AppError(403, 'You are not a member of this chat');
        }
        const messages = await Message.find({
            chat_id: chatId,
            isDeleted: false
        })
            .populate('sender_id', 'name avatar_url email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();
        return messages.reverse();
    }
    async getMessageById(messageId) {
        const message = await Message.findById(messageId).populate('sender_id', 'name avatar_url email');
        if (!message) {
            throw new AppError(404, 'Message not found');
        }
        return message;
    }
    async markAsRead(messageId, userId) {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new AppError(404, 'Message not found');
        }
        const read = await MessageRead.findOneAndUpdate({ message_id: messageId, user_id: userId }, { read_at: new Date() }, { upsert: true, new: true });
        return read;
    }
    async markChatAsRead(chatId, userId) {
        // Get all unread messages in chat
        const messages = await Message.find({
            chat_id: chatId,
            isDeleted: false
        });
        // Mark all as read
        const readData = messages.map(msg => ({
            message_id: msg._id,
            user_id: userId,
            read_at: new Date()
        }));
        await MessageRead.insertMany(readData, { ordered: false }).catch(() => {
            // Ignore duplicate key errors
        });
    }
    async getMessageReads(messageId) {
        const reads = await MessageRead.find({ message_id: messageId });
        return reads.map(r => ({
            userId: r.user_id,
            readAt: r.read_at
        }));
    }
    async editMessage(messageId, userId, newContent) {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new AppError(404, 'Message not found');
        }
        if (message.sender_id.toString() !== userId) {
            throw new AppError(403, 'You can only edit your own messages');
        }
        message.content = newContent;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();
        await message.populate('sender_id', 'name avatar_url email');
        return message;
    }
    async deleteMessage(messageId, userId) {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new AppError(404, 'Message not found');
        }
        if (message.sender_id.toString() !== userId) {
            throw new AppError(403, 'You can only delete your own messages');
        }
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = '[Message deleted]';
        await message.save();
    }
    async searchMessages(chatId, userId, query, limit = 20) {
        // Verify user is chat member
        const isMember = await chatService.isMember(chatId, userId);
        if (!isMember) {
            throw new AppError(403, 'You are not a member of this chat');
        }
        return Message.find({
            chat_id: chatId,
            content: { $regex: query, $options: 'i' },
            isDeleted: false
        })
            .populate('sender_id', 'name avatar_url email')
            .limit(limit)
            .sort({ createdAt: -1 });
    }
    async addReaction(messageId, userId, emoji) {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new AppError(404, 'Message not found');
        }
        let reaction = message.reactions?.find(r => r.emoji === emoji);
        if (!reaction) {
            message.reactions?.push({
                emoji,
                users: [new mongoose.Types.ObjectId(userId)]
            });
        }
        else {
            const userIndex = reaction.users.findIndex(id => id.toString() === userId);
            if (userIndex === -1) {
                reaction.users.push(new mongoose.Types.ObjectId(userId));
            }
        }
        await message.save();
        await message.populate('sender_id', 'name avatar_url email');
        return message;
    }
    async removeReaction(messageId, userId, emoji) {
        const message = await Message.findById(messageId);
        if (!message) {
            throw new AppError(404, 'Message not found');
        }
        const reaction = message.reactions?.find(r => r.emoji === emoji);
        if (reaction) {
            reaction.users = reaction.users.filter(id => id.toString() !== userId);
            if (reaction.users.length === 0) {
                message.reactions = message.reactions?.filter(r => r.emoji !== emoji);
            }
        }
        await message.save();
        await message.populate('sender_id', 'name avatar_url email');
        return message;
    }
}
export default new MessageService();
