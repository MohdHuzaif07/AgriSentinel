import http from 'http';
import { Server } from 'socket.io';
import app, { isOriginAllowed } from './app.js';
import connectDB from './config/db.js';
import { startMLWorker } from './queues/mlWorker.js';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});
app.set('io', io);

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
    console.log(`🚀 AgriSentinel Server running on port ${PORT}`);
  });

  // Start BullMQ ML worker (graceful — won't crash if Redis unavailable)
  await startMLWorker(io);
}).catch(err => {
  console.error('Failed to connect to database', err);
});

export { server, io };
