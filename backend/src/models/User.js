import mongoose, { Schema } from 'mongoose';
import bcryptjs from 'bcryptjs';
const userSchema = new Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 50
    },
    phone: {
        type: String,
        trim: true
    },
    avatar_url: {
        type: String
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'away'],
        default: 'offline'
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Index for email lookup
userSchema.index({ email: 1 });
// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs.genSalt(10);
        this.password = await bcryptjs.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
    return bcryptjs.compare(password, this.password);
};
// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};
export const User = mongoose.model('User', userSchema);
