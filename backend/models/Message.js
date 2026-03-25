import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  chatType: {
    type: String,
    enum: ['direct', 'project-group'],
    default: 'direct'
  },
  text: {
    type: String,
    required: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Composite index for efficient queries
messageSchema.index({ projectId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
