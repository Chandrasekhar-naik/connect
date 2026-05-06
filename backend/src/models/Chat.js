import mongoose, { Schema } from 'mongoose';
const chatSchema = new Schema({
    is_group: {
        type: Boolean,
        default: false,
        index: true
    },
    name: {
        type: String,
        trim: true,
        maxlength: 100
    },
    avatar_url: {
        type: String
    },
    description: {
        type: String,
        maxlength: 500
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastMessage: {
        type: String
    },
    lastMessageTime: {
        type: Date
    }
}, { timestamps: true });
// Index for queries
chatSchema.index({ created_by: 1 });
chatSchema.index({ is_group: 1 });
chatSchema.index({ createdAt: -1 });
export const Chat = mongoose.model('Chat', chatSchema);
