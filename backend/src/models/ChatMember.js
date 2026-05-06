import mongoose, { Schema } from 'mongoose';
const chatMemberSchema = new Schema({
    chat_id: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Composite unique index
chatMemberSchema.index({ chat_id: 1, user_id: 1 }, { unique: true });
chatMemberSchema.index({ user_id: 1 });
chatMemberSchema.index({ chat_id: 1 });
export const ChatMember = mongoose.model('ChatMember', chatMemberSchema);
