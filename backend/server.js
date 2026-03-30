import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// MongoDB Connection
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000
};

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is undefined! Set it in Render environment variables.');
  process.exit(1);
}

mongoose.connect(mongoUri, mongooseOptions)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // crash hard so render service restarts
  });

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// make socket object available to routes
app.set('io', io);

// Routes
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import messageRoutes from './routes/messages.js';
import invoiceRoutes from './routes/invoices.js';
import documentRoutes from './routes/documents.js';
import notificationRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import okrRoutes from './routes/okr.js';
import checkinRoutes from './routes/checkins.js';
import employeeRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import leavesRoutes from './routes/leaves.js';
import rewardsRoutes from './routes/rewards.js';

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/okr', okrRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/rewards', rewardsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Server error' });
});

io.on('connection', (socket) => {
  console.log('Socket.io connected', socket.id);

  socket.on('joinRoom', ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
  });

  socket.on('sendMessage', (message) => {
    // message should include roomId and payload
    io.to(message.roomId).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('Socket.io disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
