import express from 'express';
import { body, validationResult } from 'express-validator';
import Reward from '../models/Reward.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, [
  body('userId').isMongoId(),
  body('title').trim().notEmpty(),
  body('badge').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const requester = await User.findById(req.userId);
    if (!requester || (requester.role !== 'admin' && requester.role !== 'manager')) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const reward = new Reward({ ...req.body, awardedBy: req.userId });
    await reward.save();
    res.status(201).json(reward);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const filter = req.query.userId ? { userId: req.query.userId } : { userId: req.userId };
    const rewards = await Reward.find(filter).sort({ awardedAt: -1 });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
