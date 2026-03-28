import express from 'express';
import { body, query, validationResult, param } from 'express-validator';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';
import { requireManager } from '../middleware/role.js';

const router = express.Router();

// Middleware to verify user owns the project
const verifyProjectOwnership = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isAdmin = req.userRole === 'admin';
    const isManager = req.userRole === 'manager';
    const isEmployee = req.userRole === 'employee';
    const projectOwner = project.userId.toString() === req.userId;
    const assigned = (project.assignedTo || []).some((id) => id.toString() === req.userId);

    if (!isAdmin && !projectOwner && !(isManager && assigned) && !(isEmployee && assigned)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all projects for user with pagination and filtering
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('status').optional().isIn(['Not Started', 'In Progress', 'Completed', 'On Hold']),
  query('clientId').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { page = 1, limit = 10, search, status, clientId } = req.query;
    const skip = (page - 1) * limit;

    // Build filter depending on role
    let filter = {};
    if (req.userRole === 'admin') {
      filter = {};
    } else if (req.userRole === 'manager') {
      filter = { $or: [{ userId: req.userId }, { assignedTo: req.userId }] };
    } else if (req.userRole === 'employee') {
      filter = { assignedTo: req.userId };
    } else {
      filter = { userId: req.userId };
    }

    if (search) {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      );
    }
    if (status) {
      filter.status = status;
    }
    if (clientId) {
      filter.clientId = clientId;
    }

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('clientId', 'name company')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      projects,
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

// Get single project
router.get('/:id', protect, verifyProjectOwnership, async (req, res) => {
  try {
    const project = await req.project
      .populate('clientId', 'name company email')
      .populate('assignedTo', 'firstName lastName email');
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project (manager/admin)
router.post('/', protect, requireManager, [
  body('name').trim().notEmpty().withMessage('Project name required'),
  body('clientId').trim().notEmpty().withMessage('Client required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['Not Started', 'In Progress', 'Completed', 'On Hold']),
  body('startDate').optional().isISO8601().toDate(),
  body('dueDate').optional().isISO8601().toDate(),
  body('budget').optional().isFloat({ min: 0 }),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const project = new Project({
      userId: req.userId,
      ...req.body
    });

    await project.save();
    await project.populate('clientId', 'name company');
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', protect, verifyProjectOwnership, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['Not Started', 'In Progress', 'Completed', 'On Hold']),
  body('startDate').optional().isISO8601().toDate(),
  body('dueDate').optional().isISO8601().toDate(),
  body('budget').optional().isFloat({ min: 0 }),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const project = req.project;
    Object.assign(project, req.body);
    project.updatedAt = new Date();
    await project.save();
    await project.populate('clientId', 'name company');
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:id', protect, verifyProjectOwnership, async (req, res) => {
  try {
    // Delete associated tasks
    await Task.deleteMany({ projectId: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign user to project (manager/admin)
router.post('/:id/assign', protect, requireManager, verifyProjectOwnership, [
  body('userId').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const project = req.project;
    if (!project.assignedTo.includes(req.body.userId)) {
      project.assignedTo.push(req.body.userId);
      await project.save();
    }
    await project.populate('assignedTo', 'firstName lastName email');
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
