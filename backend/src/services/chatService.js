import { Chat } from '../models/Chat.js';
import { ChatMember } from '../models/ChatMember.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';
export class ChatService {
    async getOrCreateDirectChat(userId, otherUserId) {
        // Check if direct chat exists between these users
        const members = await ChatMember.find({
            user_id: { $in: [userId, otherUserId] }
        })
            .populate('chat_id')
            .exec();
        // Filter for a chat that has exactly these two members
        for (const member of members) {
            const chat = member.chat_id;
            if (chat.is_group === false) {
                const otherMember = await ChatMember.findOne({
                    chat_id: chat._id,
                    user_id: otherUserId
                });
                if (otherMember) {
                    return chat;
                }
            }
        }
        // Create new direct chat
        const newChat = new Chat({
            is_group: false,
            created_by: userId
        });
        await newChat.save();
        // Add both users as members
        await ChatMember.insertMany([
            { chat_id: newChat._id, user_id: new mongoose.Types.ObjectId(userId) },
            { chat_id: newChat._id, user_id: new mongoose.Types.ObjectId(otherUserId) }
        ]);
        return newChat;
    }
    async createGroupChat(userId, name, memberIds, description) {
        if (!name || name.trim().length === 0) {
            throw new AppError(400, 'Group name is required');
        }
        if (!memberIds || memberIds.length === 0) {
            throw new AppError(400, 'At least one member is required');
        }
        // Create group chat
        const chat = new Chat({
            is_group: true,
            name,
            description,
            created_by: userId
        });
        await chat.save();
        // Add creator and members
        const allMembers = [
            { chat_id: chat._id, user_id: new mongoose.Types.ObjectId(userId), role: 'admin' },
            ...memberIds.map(id => ({
                chat_id: chat._id,
                user_id: new mongoose.Types.ObjectId(id),
                role: 'member'
            }))
        ];
        await ChatMember.insertMany(allMembers);
        return chat;
    }
    async getUserChats(userId, limit = 50, skip = 0) {
        const memberChats = await ChatMember.find({ user_id: userId })
            .populate('chat_id')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();
        return memberChats.map(member => member.chat_id);
    }
    async getChatMembers(chatId) {
        return ChatMember.find({ chat_id: chatId }).populate('user_id', 'name email avatar_url status');
    }
    async addChatMember(chatId, userId, role = 'member') {
        // Verify chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new AppError(404, 'Chat not found');
        }
        // Check if user already in chat
        const existingMember = await ChatMember.findOne({
            chat_id: chatId,
            user_id: userId
        });
        if (existingMember) {
            throw new AppError(409, 'User is already a member of this chat');
        }
        const member = new ChatMember({
            chat_id: chatId,
            user_id: userId,
            role
        });
        await member.save();
        await member.populate('user_id', 'name email avatar_url');
        return member;
    }
    async removeChatMember(chatId, userId) {
        const result = await ChatMember.findOneAndDelete({
            chat_id: chatId,
            user_id: userId
        });
        if (!result) {
            throw new AppError(404, 'Chat member not found');
        }
    }
    async updateChat(chatId, updateData) {
        const chat = await Chat.findByIdAndUpdate(chatId, updateData, {
            new: true,
            runValidators: true
        });
        if (!chat) {
            throw new AppError(404, 'Chat not found');
        }
        return chat;
    }
    async deleteChat(chatId) {
        // Delete chat members
        await ChatMember.deleteMany({ chat_id: chatId });
        // Delete chat
        const result = await Chat.findByIdAndDelete(chatId);
        if (!result) {
            throw new AppError(404, 'Chat not found');
        }
    }
    async isMember(chatId, userId) {
        const member = await ChatMember.findOne({
            chat_id: chatId,
            user_id: userId
        });
        return !!member;
    }
    async getChatInfo(chatId) {
        const chat = await Chat.findById(chatId).populate('created_by', 'name email avatar_url');
        if (!chat) {
            throw new AppError(404, 'Chat not found');
        }
        return chat;
    }
}
export default new ChatService();
