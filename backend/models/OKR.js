import mongoose from 'mongoose';

const okrSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  objective: {
    type: String,
    required: true,
    trim: true
  },
  keyResults: [{
    title: String,
    target: Number,
    progress: {
      type: Number,
      default: 0
    },
    unit: String,
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Achieved', 'Off Track'],
      default: 'Not Started'
    }
  }],
  quarter: String,
  year: Number,
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Completed', 'Archived'],
    default: 'Draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('OKR', okrSchema);
