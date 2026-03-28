import express from 'express';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Invoice from '../models/Invoice.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const projectFilter = user.role === 'employee' ? { assignedTo: user._id } : { userId: user._id };

    const totalClients = await User.countDocuments({ role: 'client' });
    const activeProjects = await Project.countDocuments({ status: 'In Progress', ...projectFilter });
    const totalRevenue = await Invoice.aggregate([
      { $match: { status: { $in: ['Paid', 'Sent', 'Overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const taskStats = await Task.aggregate([
      { $match: user.role === 'employee' ? { assignedTo: user._id } : { userId: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalTasks = taskStats.reduce((sum, item) => sum + item.count, 0);
    const completedTasks = taskStats.find((item) => item._id === 'Completed')?.count || 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalClients,
      activeProjects,
      totalRevenue: totalRevenue[0]?.total || 0,
      taskCompletionRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
