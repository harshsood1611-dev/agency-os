import express from 'express';
import { body, validationResult } from 'express-validator';
import Leave from '../models/Leave.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, [
  body('type').isIn(['Sick', 'Vacation', 'PTO', 'Unpaid', 'Other']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('reason').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const leave = new Leave({ userId: req.userId, ...req.body });
    await leave.save();
    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const filter = user.role === 'employee' ? { userId: req.userId } : {};
    const leaves = await Leave.find(filter).sort({ startDate: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', protect, [
  body('status').isIn(['Pending', 'Approved', 'Denied', 'Cancelled'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findById(req.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) return res.status(403).json({ error: 'Not authorized' });

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave not found' });

    leave.status = req.body.status;
    await leave.save();
    res.json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
