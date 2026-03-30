import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Document from '../models/Document.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all documents
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, clientId, projectId, taskId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const queryObj = {};
    if (category) queryObj.category = category;
    if (clientId) queryObj.clientId = clientId;
    if (projectId) queryObj.projectId = projectId;
    if (taskId) queryObj.taskId = taskId;

    // Role-based filtering
    if (req.userRole === 'admin') {
      // admin can view all
    } else if (req.userRole === 'manager') {
      // allow manager to view own upload and assigned projects/tasks
      queryObj.$or = [{ userId: req.userId }];

      if (projectId) {
        queryObj.$or.push({ projectId });
      }
      if (taskId) {
        queryObj.$or.push({ taskId });
      }

      // also allow docs linked to projects assigned
      const projects = await Project.find({ assignedTo: req.userId }, '_id');
      if (projects.length) {
        queryObj.$or.push({ projectId: { $in: projects.map((p) => p._id) }});
      }

      // allow docs linked to tasks of assigned projects or tasks assigned directly to user
      const tasks = await Task.find({ $or: [ { assignedTo: req.userId }, { projectId: { $in: projects.map((p) => p._id) }} ] }, '_id');
      if (tasks.length) {
        queryObj.$or.push({ taskId: { $in: tasks.map((t) => t._id) }});
      }
    } else if (req.userRole === 'employee') {
      // employee can view own and assigned documents/projects/tasks
      const projects = await Project.find({ assignedTo: req.userId }, '_id');
      const tasks = await Task.find({ $or: [ { assignedTo: req.userId }, { projectId: { $in: projects.map((p) => p._id) }} ] }, '_id');

      queryObj.$or = [
        { userId: req.userId },
        ...(projectId ? [{ projectId }] : []),
        ...(taskId ? [{ taskId }] : []),
        ...(projects.length ? [{ projectId: { $in: projects.map((p) => p._id) }}] : []),
        ...(tasks.length ? [{ taskId: { $in: tasks.map((t) => t._id) }}] : [])
      ];
    } else {
      queryObj.userId = req.userId;
    }

    const documents = await Document.find(queryObj)
      .populate('clientId', 'name')
      .populate('projectId', 'name')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(queryObj);

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single document
router.get('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('clientId')
      .populate('projectId')
      .populate('taskId')
      .populate('uploadedBy');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAdmin = req.userRole === 'admin';
    const isManager = req.userRole === 'manager';
    const isEmployee = req.userRole === 'employee';

    if (!isAdmin) {
      let hasAccess = document.userId.toString() === req.userId;

      if (!hasAccess && document.projectId) {
        const project = await Project.findById(document.projectId);
        if (project) {
          const projectAssigned = (project.assignedTo || []).some(id => id.toString() === req.userId);
          hasAccess = hasAccess || project.userId.toString() === req.userId || projectAssigned;
        }
      }

      if (!hasAccess && document.taskId) {
        const task = await Task.findById(document.taskId);
        if (task) {
          hasAccess = hasAccess || task.assignedTo?.toString() === req.userId || task.userId.toString() === req.userId;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create document
router.post('/', protect, async (req, res) => {
  try {
    const { fileName, fileType, fileSize, fileUrl, description, category, clientId, projectId, taskId } = req.body;

    // If project/task provided, verify access
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const isAdmin = req.userRole === 'admin';
      const isProjectOwner = project.userId.toString() === req.userId;
      const projectAssigned = (project.assignedTo || []).some(id => id.toString() === req.userId);
      if (!isAdmin && !isProjectOwner && !projectAssigned) {
        return res.status(403).json({ message: 'Not authorized for this project' });
      }
    }

    if (taskId) {
      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      const project = await Project.findById(task.projectId);
      const isAdmin = req.userRole === 'admin';
      const isTaskAssignee = task.assignedTo?.toString() === req.userId;
      const isTaskOwner = task.userId.toString() === req.userId;
      const isProjectOwner = project && project.userId.toString() === req.userId;
      const projectAssigned = project && (project.assignedTo || []).some(id => id.toString() === req.userId);

      if (!isAdmin && !isTaskAssignee && !isTaskOwner && !isProjectOwner && !projectAssigned) {
        return res.status(403).json({ message: 'Not authorized for this task' });
      }
    }

    const document = new Document({
      userId: req.userId,
      fileName,
      fileType,
      fileSize,
      fileUrl,
      description,
      category,
      clientId,
      projectId,
      taskId,
      uploadedBy: req.userId
    });

    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update document
router.put('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAdmin = req.userRole === 'admin';
    let hasAccess = document.userId.toString() === req.userId;

    if (!hasAccess) {
      if (document.projectId) {
        const project = await Project.findById(document.projectId);
        if (project) {
          const projectAssigned = (project.assignedTo || []).some(id => id.toString() === req.userId);
          hasAccess = project.userId.toString() === req.userId || projectAssigned;
        }
      }
    }
    if (!hasAccess && document.taskId) {
      const task = await Task.findById(document.taskId);
      if (task) {
        hasAccess = task.assignedTo?.toString() === req.userId || task.userId.toString() === req.userId;
      }
    }

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(document, req.body, { updatedAt: new Date() });
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete document
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isAdmin = req.userRole === 'admin';
    let hasAccess = document.userId.toString() === req.userId;

    if (!hasAccess) {
      if (document.projectId) {
        const project = await Project.findById(document.projectId);
        if (project) {
          const projectAssigned = (project.assignedTo || []).some(id => id.toString() === req.userId);
          hasAccess = project.userId.toString() === req.userId || projectAssigned;
        }
      }
    }
    if (!hasAccess && document.taskId) {
      const task = await Task.findById(document.taskId);
      if (task) {
        hasAccess = task.assignedTo?.toString() === req.userId || task.userId.toString() === req.userId;
      }
    }

    if (!isAdmin && !hasAccess) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
