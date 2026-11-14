import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  getDltTemplates,
  markAsRead,
  markAllAsRead,
  createNotification,
  testTemplate,
  deleteNotification
} from '../controllers/notificationController.js';

const router = Router();

// Protect all notification routes
router.use(authenticate);

// Specific paths first to avoid parameter collision
router.get('/unread-count', getUnreadCount);
router.get('/templates', getDltTemplates);
router.put('/read-all', markAllAsRead);
router.post('/send', createNotification);
router.post('/test-template', testTemplate);

// General list & ID routes
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;

