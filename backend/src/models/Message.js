import mongoose, { Schema } from 'mongoose';
const messageSchema = new Schema({
    chat_id: {
        type: Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },
    sender_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        maxlength: 5000
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    file_url: {
        type: String
    },
    file_name: {
        type: String
    },
    file_size: {
        type: Number
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    deletedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    reactions: [
        {
            emoji: String,
            users: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'User'
                }
            ]
        }
    ]
}, { timestamps: true });
// Compound index for fast queries
messageSchema.index({ chat_id: 1, createdAt: -1 });
messageSchema.index({ chat_id: 1, isDeleted: 1 });
export const Message = mongoose.model('Message', messageSchema);
