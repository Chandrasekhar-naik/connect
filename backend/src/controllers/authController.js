import authService from '../services/authService.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
export const signup = catchAsync(async (req, res) => {
    const { email, password, name, phone } = req.body;
    const { token, user } = await authService.signup(email, password, name, phone);
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            avatar_url: user.avatar_url,
            status: user.status,
            lastSeen: user.lastSeen
        }
    });
});
export const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const { token, user } = await authService.login(email, password);
    res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            status: user.status,
            phone: user.phone,
            lastSeen: user.lastSeen
        }
    });
});
export const getCurrentUser = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const user = await authService.getCurrentUser(req.user._id.toString());
    res.json({
        success: true,
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            avatar_url: user.avatar_url,
            status: user.status,
            lastSeen: user.lastSeen
        }
    });
});
export const logout = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    await authService.logout(req.user._id.toString());
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
export const updateProfile = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(401, 'Not authenticated');
    }
    const { name, phone, password } = req.body;
    const updateData = {};
    if (name)
        updateData.name = name;
    if (phone)
        updateData.phone = phone;
    if (password)
        updateData.password = password;
    const user = await authService.updateProfile(req.user._id.toString(), updateData);
    res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            avatar_url: user.avatar_url
        }
    });
});
export const uploadAvatar = catchAsync(async (req, res) => {
    if (!req.user || !req.file) {
        throw new AppError(400, 'No file uploaded');
    }
    const result = await uploadToCloudinary(req.file.path, {
        folder: 'pulse-chat/avatars',
        public_id: `avatar-${req.user._id}-${Date.now()}`
    });
    const fileUrl = result.secure_url;
    const user = await authService.updateProfile(req.user._id.toString(), {
        avatar_url: fileUrl
    });
    res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        avatar_url: fileUrl
    });
});
export const searchUsers = catchAsync(async (req, res) => {
    const { query, limit } = req.query;
    const users = await authService.searchUsers(typeof query === 'string' ? query : undefined, parseInt(limit) || 50, req.user?._id.toString());
    res.json({
        success: true,
        users: users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            avatar_url: u.avatar_url,
            status: u.status,
            lastSeen: u.lastSeen
        }))
    });
});
export const getUserById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await authService.getUserById(id);
    res.json({
        success: true,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar_url: user.avatar_url,
            status: user.status,
            lastSeen: user.lastSeen
        }
    });
});
export default {
    signup,
    login,
    getCurrentUser,
    logout,
    updateProfile,
    uploadAvatar,
    searchUsers,
    getUserById
};
