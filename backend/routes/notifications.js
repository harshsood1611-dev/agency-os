import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const queryObj = { userId: req.userId };
    if (unread === 'true') queryObj.read = false;

    const notifications = await Notification.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(queryObj);

    res.json({
      notifications,
      unreadCount: await Notification.countDocuments({ userId: req.userId, read: false }),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single notification
router.get('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create notification
router.post('/', protect, async (req, res) => {
  try {
    const { userId, type, title, message, relatedId, relatedType } = req.body;
// Allow manager/admin to send global notifications when userId is not provided
    if (!userId) {
      const users = await User.find({}, '_id');
      const notifications = await Notification.insertMany(
        users.map(u => ({
          userId: u._id,
          type,
          title,
          message,
          relatedId,
          relatedType
        }))
      );
      return res.status(201).json(notifications);
    }

    
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark all as read
router.put('/user/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
