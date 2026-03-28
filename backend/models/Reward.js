import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  badge: String,
  awardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  awardedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Reward', rewardSchema);
