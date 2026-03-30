import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'AgencyOS'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  primaryColor: {
    type: String,
    default: '#2563eb'
  },
  secondaryColor: {
    type: String,
    default: '#1d4ed8'
  },
  dateFormat: {
    type: String,
    default: 'YYYY-MM-DD'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Settings', settingsSchema);
