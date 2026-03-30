import express from 'express';
import { body, validationResult } from 'express-validator';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/role.js';

const router = express.Router();

// Get current settings (all roles can read)
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings (admin only)
router.put('/', protect, requireAdmin, [
  body('companyName').optional().trim().notEmpty(),
  body('logoUrl').optional().trim().isURL().withMessage('Invalid logo URL'),
  body('primaryColor').optional().trim().isLength({ min: 4, max: 20 }),
  body('secondaryColor').optional().trim().isLength({ min: 4, max: 20 }),
  body('dateFormat').optional().trim(),
  body('timezone').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ ...req.body, updatedBy: req.userId, updatedAt: new Date() });
    } else {
      Object.assign(settings, req.body, {
        updatedBy: req.userId,
        updatedAt: new Date()
      });
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
