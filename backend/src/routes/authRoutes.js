import express from 'express';
import * as authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadSingle } from '../config/multer.js';
import { validateSignup, validateLogin, validateUpdateProfile } from '../middleware/validation.js';
const router = express.Router();
// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);
router.put('/profile', authMiddleware, validateUpdateProfile, authController.updateProfile);
router.post('/avatar', authMiddleware, uploadSingle, authController.uploadAvatar);
router.get('/search', authMiddleware, authController.searchUsers);
router.get('/users/:id', authMiddleware, authController.getUserById);
export default router;
