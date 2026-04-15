import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import academicRoutes from './routes/academic.js';
import noticeRoutes from './routes/notices.js';
import reportsRoutes from './routes/reports.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_role_room', (role) => {
    socket.join(role);
  });

  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(helmet()); // Security headers
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/reports', reportsRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'online', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5001;
const DB_URI = process.env.MONGODB_URI;

mongoose.connect(DB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Successfully!');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed!');
    console.error('Error Details:', err.message);
    if (err.message.includes('IP address')) {
      console.error('TIP: Check if your IP is whitelisted in MongoDB Atlas Network Access.');
    }
  });
