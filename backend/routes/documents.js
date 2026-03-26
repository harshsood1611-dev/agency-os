import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Document from '../models/Document.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all documents
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, clientId, projectId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const queryObj = { userId: req.userId };
    if (category) queryObj.category = category;
    if (clientId) queryObj.clientId = clientId;
    if (projectId) queryObj.projectId = projectId;

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
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('clientId').populate('projectId').populate('uploadedBy');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
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
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete document
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
