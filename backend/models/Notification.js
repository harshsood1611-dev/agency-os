import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task_assigned', 'task_completed', 'deadline_approaching', 'payment_due', 'message_received', 'project_update'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: String,
  relatedId: mongoose.Schema.Types.ObjectId,
  relatedType: {
    type: String,
    enum: ['Task', 'Project', 'Invoice', 'Message'],
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Notification', notificationSchema);
