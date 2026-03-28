import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Remote', 'Sick', 'On Leave'],
    default: 'Present'
  },
  checkIn: Date,
  checkOut: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Attendance', attendanceSchema);
