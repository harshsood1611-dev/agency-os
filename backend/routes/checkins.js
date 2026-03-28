import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Checkin from '../models/Checkin.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Weekly check-in
router.post('/', protect, [
  body('weekStart').isISO8601(),
  body('progressSummary').optional().trim(),
  body('blockers').optional().trim(),
  body('focusForNextWeek').optional().trim(),
  body('rating').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const checkin = new Checkin({ userId: req.userId, ...req.body });
    await checkin.save();
    res.status(201).json(checkin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get checkins by user or own
router.get('/', protect, [query('userId').optional().isMongoId()], async (req, res) => {
  try {
    const filter = { userId: req.query.userId || req.userId };
    const checkins = await Checkin.find(filter).sort({ weekStart: -1 });
    res.json(checkins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
