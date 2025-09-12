import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user notifications
router.get('/', protect, getNotifications);

// Get unread count
router.get('/unread-count', protect, getUnreadCount);

// Mark notification as read
router.patch('/:id/read', protect, markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', protect, markAllAsRead);

// Delete notification
router.delete('/:id', protect, deleteNotification);

export default router;