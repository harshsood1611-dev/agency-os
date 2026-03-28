import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

(async function() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agencyos';
    await mongoose.connect(mongoUri);

    const admin = await User.findOneAndUpdate(
      { email: 'admin@agencyos.com' },
      {
        email: 'admin@agencyos.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        agencyName: 'AgencyOS',
        role: 'admin'
      },
      { upsert: true, new: true }
    );

    const manager = await User.findOneAndUpdate(
      { email: 'manager@agencyos.com' },
      {
        email: 'manager@agencyos.com',
        password: 'Manager123!',
        firstName: 'Manager',
        lastName: 'Lead',
        agencyName: 'AgencyOS',
        role: 'manager'
      },
      { upsert: true, new: true }
    );

    console.log('Seeded users:');
    console.log('Admin ID:', admin._id.toString());
    console.log('Manager ID:', manager._id.toString());
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
