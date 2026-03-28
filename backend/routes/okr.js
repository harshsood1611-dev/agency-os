import express from 'express';
import { body, query, validationResult } from 'express-validator';
import OKR from '../models/OKR.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Create OKR
router.post('/', protect, [
  body('objective').trim().notEmpty().withMessage('Objective is required'),
  body('quarter').optional().trim(),
  body('year').optional().isInt({ min: 1900, max: 2100 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const okr = new OKR({
      userId: req.userId,
      ...req.body,
      status: req.body.status || 'Draft'
    });

    await okr.save();
    res.status(201).json(okr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all OKRs for user or team (manager/admin can fetch all)
router.get('/', protect, [
  query('userId').optional().isMongoId()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.userId);
    const filter = {};
    if (user.role === 'employee') {
      filter.userId = req.userId;
    } else if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    const okrs = await OKR.find(filter)
      .populate('userId', 'firstName lastName email role')
      .populate('projectId', 'name');

    res.json(okrs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update OKR
router.put('/:id', protect, async (req, res) => {
  try {
    const okr = await OKR.findById(req.params.id);
    if (!okr) return res.status(404).json({ error: 'OKR not found' });
    if (okr.userId.toString() !== req.userId && req.userRole !== 'admin' && req.userRole !== 'manager') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Object.assign(okr, req.body, { updatedAt: new Date() });
    await okr.save();
    res.json(okr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete OKR
router.delete('/:id', protect, async (req, res) => {
  try {
    const okr = await OKR.findById(req.params.id);
    if (!okr) return res.status(404).json({ error: 'OKR not found' });
    if (okr.userId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await OKR.findByIdAndDelete(req.params.id);
    res.json({ message: 'OKR deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
