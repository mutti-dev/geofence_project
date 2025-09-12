import Notification from '../models/Notification.js';

// @desc Get user notifications
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    
    const query = { user: userId };
    if (type) query.type = type;
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(query);
    
    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    next(err);
  }
};

// @desc Mark notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read', notification });
  } catch (err) {
    next(err);
  }
};

// @desc Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// @desc Delete notification
export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc Get unread count
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const count = await Notification.countDocuments({
      user: userId,
      read: false
    });
    
    res.json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
};

// @desc Create notification (internal use)
export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
      read: false
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createNotification
};