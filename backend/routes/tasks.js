import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';
import { requireManager, requireEmployee } from '../middleware/role.js';

const router = express.Router();

// Middleware to verify user has access to task (via project)
const verifyTaskAccess = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isAdmin = req.userRole === 'admin';
    const isManager = req.userRole === 'manager';
    const isEmployee = req.userRole === 'employee';

    const isProjectOwner = project.userId.toString() === req.userId;
    const isProjectAssignee = project.assignedTo?.some(id => id.toString() === req.userId);
    const isTaskAssignee = task.assignedTo?.toString() === req.userId || (Array.isArray(task.assignedTo) && task.assignedTo.some(id => id.toString() === req.userId));

    if (!isAdmin && !isProjectOwner && !(isManager && isProjectAssignee) && !(isEmployee && isTaskAssignee)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    req.task = task;
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all tasks for user with pagination and filtering
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('projectId').optional().trim(),
  query('status').optional().isIn(['New', 'In Progress', 'Completed', 'Blocked']),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { page = 1, limit = 10, projectId, status, priority } = req.query;
    const skip = (page - 1) * limit;

    // Build filter based on role
    let filter = {};
    if (req.userRole === 'admin') {
      filter = {};
    } else if (req.userRole === 'manager') {
      const userProjects = await Project.find({ $or: [{ userId: req.userId }, { assignedTo: req.userId }] }, '_id');
      const projectIds = userProjects.map(p => p._id);
      filter = { projectId: { $in: projectIds } };
    } else {
      const userProjects = await Project.find({ assignedTo: req.userId }, '_id');
      const projectIds = userProjects.map(p => p._id);
      filter = {
        $or: [
          { assignedTo: req.userId },
          ...(projectIds.length ? [{ projectId: { $in: projectIds } }] : [])
        ]
      };
    }
    if (projectId) {
      filter.projectId = projectId;
    }
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }

    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('projectId', 'name')
      .populate('assignedTo', 'firstName lastName email')
      .populate('comments.userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      tasks,
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

// Get tasks for a specific project (Kanban view)
router.get('/project/:projectId/kanban', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isAdmin = req.userRole === 'admin';
    const projectOwner = project.userId.toString() === req.userId;
    const projectAssigned = (project.assignedTo || []).some((id) => id.toString() === req.userId);

    if (!isAdmin && !projectOwner && !projectAssigned) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'firstName lastName email')
      .populate('comments.userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Group tasks by status
    const kanbanBoard = {
      'New': [],
      'In Progress': [],
      'Completed': [],
      'Blocked': []
    };

    tasks.forEach(task => {
      kanbanBoard[task.status].push(task);
    });

    res.json(kanbanBoard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', protect, verifyTaskAccess, async (req, res) => {
  try {
    const task = await req.task
      .populate('projectId', 'name')
      .populate('assignedTo', 'firstName lastName email')
      .populate('comments.userId', 'firstName lastName email');
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task (manager/admin)
router.post('/', protect, requireManager, [
  body('title').trim().notEmpty().withMessage('Task title required'),
  body('projectId').trim().notEmpty().withMessage('Project required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['New', 'In Progress', 'Completed', 'Blocked']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('dueDate').optional().isISO8601().toDate()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Verify project ownership
    const project = await Project.findById(req.body.projectId);
    if (!project || project.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const task = new Task({
      userId: req.userId,
      ...req.body
    });

    await task.save();
    await task.populate('projectId', 'name');
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', protect, verifyTaskAccess, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['New', 'In Progress', 'Completed', 'Blocked']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('dueDate').optional().isISO8601().toDate()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const task = req.task;
    const isAdmin = req.userRole === 'admin';
    const isManager = req.userRole === 'manager';
    const isEmployee = req.userRole === 'employee';

    if (isEmployee) {
      const allowedFields = ['status', 'comments'];
      const updateFields = Object.keys(req.body);
      const notAllowed = updateFields.filter((field) => !allowedFields.includes(field));
      if (notAllowed.length > 0) {
        return res.status(403).json({ error: 'Employee cannot modify this field' });
      }
    }

    // If status is completed, set completedAt
    if (req.body.status === 'Completed' && task.status !== 'Completed') {
      task.completedAt = new Date();
    }

    Object.assign(task, req.body);
    task.updatedAt = new Date();
    await task.save();
    await task.populate('assignedTo', 'firstName lastName email');
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', protect, verifyTaskAccess, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to task
router.post('/:id/comments', protect, verifyTaskAccess, [
  body('text').trim().notEmpty().withMessage('Comment text required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const task = req.task;
    task.comments.push({
      userId: req.userId,
      text: req.body.text,
      createdAt: new Date()
    });
    await task.save();
    await task.populate('comments.userId', 'firstName lastName email');
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
