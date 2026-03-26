import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Invoice from '../models/Invoice.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all invoices
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, clientId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const queryObj = { userId: req.userId };
    if (status) queryObj.status = status;
    if (clientId) queryObj.clientId = clientId;

    const invoices = await Invoice.find(queryObj)
      .populate('clientId', 'name company')
      .populate('projectId', 'name')
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(queryObj);

    res.json({
      invoices,
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

// Get single invoice
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('clientId').populate('projectId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create invoice
router.post('/', protect, async (req, res) => {
  try {
    const { clientId, projectId, amount, description, dueDate, invoiceNumber } = req.body;

    const invoice = new Invoice({
      userId: req.userId,
      clientId,
      projectId,
      amount,
      description,
      dueDate,
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update invoice
router.put('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete invoice
router.delete('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get revenue overview
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.userId });
    
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidAmount = invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const pendingAmount = invoices
      .filter(inv => inv.status === 'Sent' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const overdueAmount = invoices
      .filter(inv => inv.status === 'Overdue')
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);

    res.json({
      totalRevenue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.status === 'Paid').length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
