import express from 'express';
import * as messageController from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadSingle } from '../config/multer.js';
import { validateSendMessage, validateGetMessages, validateMarkAsRead } from '../middleware/validation.js';
const router = express.Router();
// All routes require authentication
router.use(authMiddleware);
// Message routes
router.post('/upload', uploadSingle, messageController.uploadAttachment);
router.post('/', validateSendMessage, messageController.sendMessage);
router.get('/:chat_id', validateGetMessages, messageController.getMessages);
router.post('/read/mark', validateMarkAsRead, messageController.markAsRead);
router.post('/:chat_id/read', messageController.markChatAsRead);
router.get('/:message_id/reads', messageController.getMessageReads);
router.put('/:message_id', messageController.editMessage);
router.delete('/:message_id', messageController.deleteMessage);
router.get('/:chat_id/search', messageController.searchMessages);
router.post('/:message_id/reactions', messageController.addReaction);
router.delete('/:message_id/reactions', messageController.removeReaction);
export default router;
