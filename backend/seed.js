import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

(async function() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agencyos';
    await mongoose.connect(mongoUri);

    const createOrUpdate = async ({ email, password, firstName, lastName, role }) => {
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ email, password, firstName, lastName, agencyName: 'AgencyOS', role });
      } else {
        user.firstName = firstName;
        user.lastName = lastName;
        user.role = role;
        user.password = password; // will hash on save
      }
      await user.save();
      return user;
    };

    const admin = await createOrUpdate({
      email: 'admin@agencyos.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    const manager = await createOrUpdate({
      email: 'manager@agencyos.com',
      password: 'Manager123!',
      firstName: 'Manager',
      lastName: 'Lead',
      role: 'manager'
    });

    console.log('Seeded users:');
    console.log('Admin ID:', admin._id.toString());
    console.log('Manager ID:', manager._id.toString());
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
