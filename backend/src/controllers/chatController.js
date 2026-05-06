import chatService from '../services/chatService.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { ChatMember } from '../models/ChatMember.js';
export const getOrCreateDirectChat = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { other_user_id } = req.body;
    if (!other_user_id) {
        throw new AppError(400, 'other_user_id is required');
    }
    const chat = await chatService.getOrCreateDirectChat(req.user._id.toString(), other_user_id);
    res.json({
        success: true,
        chat_id: chat._id,
        chat: {
            id: chat._id,
            is_group: chat.is_group,
            name: chat.name,
            avatar_url: chat.avatar_url,
            createdAt: chat.createdAt
        }
    });
});
export const createGroupChat = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { name, member_ids, description } = req.body;
    const chat = await chatService.createGroupChat(req.user._id.toString(), name, member_ids, description);
    res.status(201).json({
        success: true,
        message: 'Group chat created successfully',
        chat: {
            id: chat._id,
            is_group: chat.is_group,
            name: chat.name,
            avatar_url: chat.avatar_url,
            description: chat.description,
            createdAt: chat.createdAt
        }
    });
});
export const getUserChats = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { limit = 50, skip = 0 } = req.query;
    const chats = await chatService.getUserChats(req.user._id.toString(), parseInt(limit), parseInt(skip));
    const chatIds = chats.map(chat => chat._id);
    const chatMembers = chatIds.length
        ? await ChatMember.find({ chat_id: { $in: chatIds } }).populate('user_id', 'name email phone avatar_url status lastSeen')
        : [];
    const membersByChat = new Map();
    for (const member of chatMembers) {
        const chatId = member.chat_id.toString();
        const bucket = membersByChat.get(chatId) ?? [];
        bucket.push(member);
        membersByChat.set(chatId, bucket);
    }
    res.json({
        success: true,
        count: chats.length,
        chats: chats.map(chat => {
            const members = membersByChat.get(chat._id.toString()) ?? [];
            const otherUser = members
                .map(member => member.user_id)
                .find(member => member._id.toString() !== req.user._id.toString());
            return {
                id: chat._id,
                is_group: chat.is_group,
                name: chat.is_group ? chat.name : null,
                avatar_url: chat.avatar_url,
                lastMessage: chat.lastMessage,
                lastMessageTime: chat.lastMessageTime,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
                memberCount: members.length,
                otherUser: otherUser
                    ? {
                        id: otherUser._id,
                        name: otherUser.name,
                        email: otherUser.email,
                        phone: otherUser.phone,
                        avatar_url: otherUser.avatar_url,
                        status: otherUser.status,
                        lastSeen: otherUser.lastSeen
                    }
                    : null
            };
        })
    });
});
export const getChatMembers = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { chatId } = req.params;
    const isMember = await chatService.isMember(chatId, req.user._id.toString());
    if (!isMember) {
        throw new AppError(403, 'You are not a member of this chat');
    }
    const members = await chatService.getChatMembers(chatId);
    res.json({
        success: true,
        count: members.length,
        members: members.map((m) => ({
            id: m.user_id._id,
            name: m.user_id.name,
            email: m.user_id.email,
            phone: m.user_id.phone,
            avatar_url: m.user_id.avatar_url,
            status: m.user_id.status,
            lastSeen: m.user_id.lastSeen,
            role: m.role,
            joinedAt: m.joinedAt
        }))
    });
});
export const addChatMember = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { chatId } = req.params;
    const { user_id } = req.body;
    const isMember = await chatService.isMember(chatId, req.user._id.toString());
    if (!isMember) {
        throw new AppError(403, 'You are not a member of this chat');
    }
    const member = await chatService.addChatMember(chatId, user_id);
    res.status(201).json({
        success: true,
        message: 'Member added successfully',
        member: {
            id: member.user_id._id,
            name: member.user_id.name,
            role: member.role
        }
    });
});
export const removeChatMember = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { chatId, memberId } = req.params;
    const isMember = await chatService.isMember(chatId, req.user._id.toString());
    if (!isMember) {
        throw new AppError(403, 'You are not a member of this chat');
    }
    await chatService.removeChatMember(chatId, memberId);
    res.json({
        success: true,
        message: 'Member removed successfully'
    });
});
export const updateChat = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { chatId } = req.params;
    const { name, description } = req.body;
    const chat = await chatService.getChatInfo(chatId);
    if (chat.created_by.toString() !== req.user._id.toString()) {
        throw new AppError(403, 'Only chat creator can update chat');
    }
    const updatedChat = await chatService.updateChat(chatId, {
        name,
        description
    });
    res.json({
        success: true,
        message: 'Chat updated successfully',
        chat: {
            id: updatedChat._id,
            name: updatedChat.name,
            description: updatedChat.description
        }
    });
});
export const deleteChat = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { chatId } = req.params;
    const chat = await chatService.getChatInfo(chatId);
    if (chat.created_by.toString() !== req.user._id.toString()) {
        throw new AppError(403, 'Only chat creator can delete chat');
    }
    await chatService.deleteChat(chatId);
    res.json({
        success: true,
        message: 'Chat deleted successfully'
    });
});
export default {
    getOrCreateDirectChat,
    createGroupChat,
    getUserChats,
    getChatMembers,
    addChatMember,
    removeChatMember,
    updateChat,
    deleteChat
};
