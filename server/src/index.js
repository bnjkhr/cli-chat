import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { register, login, logout } from './handlers/auth.js';
import { authenticateSocket } from './middleware/auth.js';
import {
  handleSendMessage,
  handleJoinRoom,
  handleLeaveRoom,
  handleGetRooms,
  handleGetUsers
} from './handlers/chat.js';
import {
  handleCreateRoom,
  handleBanUser,
  handleUnbanUser,
  handleKickUser,
  handleDeleteRoom
} from './handlers/admin.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// ============================================
// Express Middleware
// ============================================

app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // 100 Requests pro IP
  message: 'Too many requests, please try again later'
});
app.use(limiter);

// ============================================
// REST API Routes
// ============================================

app.get('/', (req, res) => {
  res.json({
    name: 'CLI-Chat Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Auth Routes
app.post('/auth/register', register);
app.post('/auth/login', login);
app.post('/auth/logout', logout);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Socket.io Connection
// ============================================

// Socket.io Middleware: Authentication
io.use(authenticateSocket);

io.on('connection', (socket) => {
  const { userId, username, role } = socket;

  logger.info(`User connected: ${username} (${userId})`);

  // User-spezifischer Raum (für DMs und Notifications)
  socket.join(`user:${userId}`);

  // Sende User-Info zurück
  socket.emit('authenticated', {
    userId,
    username,
    role
  });

  // ============================================
  // Chat Events
  // ============================================

  // Nachricht senden (Room oder DM)
  socket.on('send_message', (data) => {
    handleSendMessage(io, socket, data);
  });

  // Raum beitreten
  socket.on('join_room', (data) => {
    handleJoinRoom(io, socket, data);
  });

  // Raum verlassen
  socket.on('leave_room', (data) => {
    handleLeaveRoom(socket, data);
  });

  // Räume auflisten
  socket.on('get_rooms', () => {
    handleGetRooms(socket);
  });

  // User im Raum auflisten
  socket.on('get_users', () => {
    handleGetUsers(io, socket);
  });

  // ============================================
  // Admin Events
  // ============================================

  // Raum erstellen
  socket.on('admin:create_room', (data) => {
    handleCreateRoom(socket, data);
  });

  // User bannen
  socket.on('admin:ban_user', (data) => {
    handleBanUser(io, socket, data);
  });

  // User unbannen
  socket.on('admin:unban_user', (data) => {
    handleUnbanUser(socket, data);
  });

  // User kicken
  socket.on('admin:kick_user', (data) => {
    handleKickUser(io, socket, data);
  });

  // Raum löschen
  socket.on('admin:delete_room', (data) => {
    handleDeleteRoom(io, socket, data);
  });

  // ============================================
  // Typing Indicator (optional)
  // ============================================

  socket.on('typing_start', (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.to(`room:${roomId}`).emit('user_typing', {
        username,
        roomId
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.to(`room:${roomId}`).emit('user_stopped_typing', {
        username,
        roomId
      });
    }
  });

  // ============================================
  // Disconnect
  // ============================================

  socket.on('disconnect', (reason) => {
    logger.info(`User disconnected: ${username} (${reason})`);

    // Wenn User in einem Raum war, anderen Bescheid geben
    if (socket.currentRoom) {
      socket.to(`room:${socket.currentRoom}`).emit('user_left', {
        username,
        roomId: socket.currentRoom
      });
    }
  });

  // Error Handling
  socket.on('error', (error) => {
    logger.error(`Socket error for ${username}:`, error);
  });
});

// ============================================
// Start Server
// ============================================

httpServer.listen(PORT, () => {
  logger.info(`🚀 CLI-Chat Server running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
