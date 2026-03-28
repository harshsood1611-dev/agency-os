import express from 'express';
import { body, query, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// get all employees (admin/manager)
router.get('/', protect, async (req, res) => {
  try {
    // this assumes that protect includes role, but fallback to DB lookup
    const user = await User.findById(req.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const filter = { role: { $in: ['manager', 'employee'] } };
    const employees = await User.find(filter).select('-password');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get employee by id
router.get('/:id', protect, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.userId);
    if (!requestingUser) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (requestingUser.role === 'employee' && req.params.id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update employee profile/role by admin/manager
router.put('/:id', protect, [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('role').optional().isIn(['admin', 'manager', 'employee', 'client']),
  body('status').optional().isIn(['active', 'inactive', 'on_leave', 'terminated'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const requestingUser = await User.findById(req.userId);
    if (!requestingUser || (requestingUser.role !== 'admin' && requestingUser.role !== 'manager')) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    Object.assign(employee, req.body);
    await employee.save();
    const sanitized = employee.toObject();
    delete sanitized.password;
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
