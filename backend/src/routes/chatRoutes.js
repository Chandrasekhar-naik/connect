import express from 'express';
import * as chatController from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateCreateChat, validateCreateGroupChat, validateUpdateChat } from '../middleware/validation.js';
const router = express.Router();
// All routes require authentication
router.use(authMiddleware);
// Chat routes
router.post('/direct', validateCreateChat, chatController.getOrCreateDirectChat);
router.post('/group', validateCreateGroupChat, chatController.createGroupChat);
router.get('/', chatController.getUserChats);
router.get('/:chatId/members', chatController.getChatMembers);
router.post('/:chatId/members', chatController.addChatMember);
router.delete('/:chatId/members/:memberId', chatController.removeChatMember);
router.put('/:chatId', validateUpdateChat, chatController.updateChat);
router.delete('/:chatId', chatController.deleteChat);
export default router;
