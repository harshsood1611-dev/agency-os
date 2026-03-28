import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Client from '../models/Client.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Middleware to verify user owns the client
const verifyClientOwnership = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client || client.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    req.client = client;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all clients for user with pagination and filtering
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('status').optional().isIn(['lead', 'prospect', 'active', 'inactive'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { userId: req.userId };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      filter.status = status;
    }

    const total = await Client.countDocuments(filter);
    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      clients,
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

// Get single client
router.get('/:id', protect, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client || client.userId.toString() !== req.userId) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create client
router.post('/', protect, [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('status').optional().isIn(['lead', 'prospect', 'active', 'inactive']),
  body('rate').optional().isFloat({ min: 0 }),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zip').optional().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const client = new Client({
      userId: req.userId,
      ...req.body
    });

    await client.save();
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client
router.put('/:id', protect, verifyClientOwnership, [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('status').optional().isIn(['lead', 'prospect', 'active', 'inactive']),
  body('rate').optional().isFloat({ min: 0 }),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('zip').optional().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const client = req.client;
    Object.assign(client, req.body);
    client.updatedAt = new Date();
    await client.save();
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete client
router.delete('/:id', protect, verifyClientOwnership, async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const totalClients = await Client.countDocuments({ userId: req.userId });
    const activeClients = await Client.countDocuments({
      userId: req.userId,
      status: 'active'
    });
    const prospects = await Client.countDocuments({
      userId: req.userId,
      status: 'prospect'
    });
    const leads = await Client.countDocuments({
      userId: req.userId,
      status: 'lead'
    });

    res.json({
      totalClients,
      activeClients,
      prospects,
      leads
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
