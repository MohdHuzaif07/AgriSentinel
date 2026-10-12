import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { startMLWorker } from './queues/mlWorker.js';

dotenv.config();

const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (configuredOrigins.includes(origin) || configuredOrigins.includes('*')) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.startsWith('http://localhost:')) return true;
  return false;
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});
app.set('io', io);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));  // Allow base64 images up to 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io — connection management
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Farmer can join their personal room for targeted alerts/results
  socket.on('join:farmer', (farmerId) => {
    socket.join(`farmer:${farmerId}`);
    console.log(`Socket ${socket.id} joined farmer room: ${farmerId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Start BullMQ ML worker (graceful — won't crash if Redis unavailable)
  await startMLWorker(io);
}).catch(err => {
  console.error('Failed to connect to database', err);
});
