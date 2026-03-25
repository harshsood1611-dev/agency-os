import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get direct messages with a user
router.get('/direct/:userId', protect, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const otherUserId = req.params.userId;

    // Get messages between current user and the other user
    const filter = {
      chatType: 'direct',
      $or: [
        { senderId: req.userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: req.userId }
      ]
    };

    const total = await Message.countDocuments(filter);
    const messages = await Message.find(filter)
      .populate('senderId', 'firstName lastName email avatar')
      .populate('recipientId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark as read
    await Message.updateMany(
      { ...filter, recipientId: req.userId, isRead: false },
      { isRead: true }
    );

    res.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get project group chat
router.get('/project/:projectId', protect, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify user has access to project
    const project = await Project.findById(req.params.projectId);
    if (!project || project.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const filter = {
      chatType: 'project-group',
      projectId: req.params.projectId
    };

    const total = await Message.countDocuments(filter);
    const messages = await Message.find(filter)
      .populate('senderId', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark as read
    await Message.updateMany(
      { ...filter, isRead: false },
      { isRead: true }
    );

    res.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send direct message
router.post('/direct/send', protect, [
  body('recipientId').trim().notEmpty(),
  body('text').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const message = new Message({
      senderId: req.userId,
      recipientId: req.body.recipientId,
      chatType: 'direct',
      text: req.body.text
    });

    await message.save();
    await message.populate('senderId', 'firstName lastName email');
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send project group message
router.post('/project/:projectId/send', protect, [
  body('text').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Verify project access
    const project = await Project.findById(req.params.projectId);
    if (!project || project.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const message = new Message({
      senderId: req.userId,
      projectId: req.params.projectId,
      chatType: 'project-group',
      text: req.body.text
    });

    await message.save();
    await message.populate('senderId', 'firstName lastName email');
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message || message.senderId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
