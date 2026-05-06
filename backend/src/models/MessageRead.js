import mongoose, { Schema } from 'mongoose';
const messageReadSchema = new Schema({
    message_id: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    read_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false });
// Composite unique index
messageReadSchema.index({ message_id: 1, user_id: 1 }, { unique: true });
messageReadSchema.index({ message_id: 1 });
export const MessageRead = mongoose.model('MessageRead', messageReadSchema);
