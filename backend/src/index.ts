import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from './server.js';
import { env } from './config/environment.js';
import { connectDatabase } from './config/database.js';

const startServer = async () => {
  const app = createServer();
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on('join:room', (room: string) => {
      socket.join(room);
      console.log(`[WebSocket] Socket ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  // Make io accessible globally or attach to app
  app.set('io', io);

  // Start HTTP and WebSocket server
  server.listen(env.PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` Smart OPD Backend Server Running on Port: ${env.PORT}`);
    console.log(` Environment: ${env.NODE_ENV}`);
    console.log(` API Base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
    console.log(` Health Check: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    console.log(`====================================================`);
  });

  // Connect to Database asynchronously
  connectDatabase();

  const shutdown = () => {
    console.log('\n[Server] Gracefully shutting down...');
    server.close(() => {
      console.log('[Server] HTTP and WebSocket connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer().catch((err) => {
  console.error('[Server] Fatal startup failure:', err);
  process.exit(1);
});
