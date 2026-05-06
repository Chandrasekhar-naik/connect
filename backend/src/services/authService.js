import { User } from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
export class AuthService {
    async signup(email, password, name, phone) {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError(409, 'User already exists with this email');
        }
        // Create new user
        const user = new User({ email, password, name, phone });
        await user.save();
        const token = generateToken(user._id.toString());
        return {
            token,
            user: user
        };
    }
    async login(email, password) {
        // Find user and select password field
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new AppError(401, 'Invalid email or password');
        }
        // Check password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            throw new AppError(401, 'Invalid email or password');
        }
        // Update status to online
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();
        const token = generateToken(user._id.toString());
        return {
            token,
            user: user
        };
    }
    async getCurrentUser(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError(404, 'User not found');
        }
        return user;
    }
    async logout(userId) {
        await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: new Date()
        });
    }
    async updateProfile(userId, updateData) {
        const user = await User.findById(userId).select('+password');
        if (!user) {
            throw new AppError(404, 'User not found');
        }
        if (typeof updateData.name !== 'undefined') {
            user.name = updateData.name;
        }
        if (typeof updateData.phone !== 'undefined') {
            user.phone = updateData.phone;
        }
        if (typeof updateData.avatar_url !== 'undefined') {
            user.avatar_url = updateData.avatar_url;
        }
        if (typeof updateData.password !== 'undefined') {
            user.password = updateData.password;
        }
        await user.save();
        return user;
    }
    async searchUsers(query, limit = 10, excludeUserId) {
        const filters = [];
        if (query && query.trim()) {
            filters.push({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } },
                    { phone: { $regex: query, $options: 'i' } }
                ]
            });
        }
        if (excludeUserId) {
            filters.push({ _id: { $ne: excludeUserId } });
        }
        return User.find(filters.length > 0 ? { $and: filters } : {})
            .limit(limit)
            .select('-password');
    }
    async getUserById(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            throw new AppError(404, 'User not found');
        }
        return user;
    }
}
export default new AuthService();
