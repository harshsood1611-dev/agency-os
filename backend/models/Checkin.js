import mongoose from 'mongoose';

const checkinSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  progressSummary: String,
  blockers: String,
  focusForNextWeek: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Checkin', checkinSchema);
