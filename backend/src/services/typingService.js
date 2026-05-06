import { TypingStatus } from '../models/TypingStatus.js';
import { AppError } from '../middleware/errorHandler.js';
import chatService from './chatService.js';
export class TypingService {
    async setTyping(chatId, userId) {
        // Verify user is chat member
        const isMember = await chatService.isMember(chatId, userId);
        if (!isMember) {
            throw new AppError(403, 'You are not a member of this chat');
        }
        return TypingStatus.findOneAndUpdate({ chat_id: chatId, user_id: userId }, { updated_at: new Date() }, { upsert: true, new: true });
    }
    async removeTyping(chatId, userId) {
        await TypingStatus.deleteOne({
            chat_id: chatId,
            user_id: userId
        });
    }
    async getTypingUsers(chatId) {
        const typingStatuses = await TypingStatus.find({ chat_id: chatId });
        return typingStatuses.map(ts => ts.user_id.toString());
    }
    async clearChatTyping(chatId) {
        await TypingStatus.deleteMany({ chat_id: chatId });
    }
}
export default new TypingService();
