import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import academicRoutes from './routes/academic.js';
import noticeRoutes from './routes/notices.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware
import helmet from 'helmet';
app.use(helmet()); // Security headers
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/submissions/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/reports', reportsRoutes);

const PORT = process.env.PORT || 5001;
const DB_URI = process.env.MONGODB_URI;

mongoose.connect(DB_URI)
  .then(() => {
    console.log('Connected to MongoDB Successfully!');
    app.listen(PORT, () => {
      console.log(`Node Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });
