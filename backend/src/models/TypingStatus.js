import mongoose, { Schema } from 'mongoose';
const typingStatusSchema = new Schema({
    chat_id: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    updated_at: {
        type: Date,
        default: Date.now,
        expires: 5 // Auto-delete after 5 seconds
    }
}, { timestamps: false });
// Composite unique index
typingStatusSchema.index({ chat_id: 1, user_id: 1 }, { unique: true });
export const TypingStatus = mongoose.model('TypingStatus', typingStatusSchema);
