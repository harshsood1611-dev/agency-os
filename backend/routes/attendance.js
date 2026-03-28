import express from 'express';
import { body, validationResult } from 'express-validator';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, [
  body('date').isISO8601(),
  body('status').isIn(['Present', 'Absent', 'Remote', 'Sick', 'On Leave'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const attendance = new Attendance({ userId: req.userId, ...req.body });
    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const filter = {};
    if (user.role === 'employee') {
      filter.userId = req.userId;
    }
    const attendances = await Attendance.find(filter).sort({ date: -1 });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
