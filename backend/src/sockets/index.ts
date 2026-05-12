import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../config/jwt';
import logger from '../utils/logger';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = verifyAccessToken(token);
      (socket as Socket & { userId: string; userRole: string }).userId = decoded.userId;
      (socket as Socket & { userId: string; userRole: string }).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, userRole } = socket as Socket & { userId: string; userRole: string };
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join role-based room
    socket.join(`role:${userRole}`);

    // Handle vendor joining their store room
    socket.on('joinVendorRoom', (vendorId: string) => {
      socket.join(`vendor:${vendorId}`);
    });

    // Admin joins admin room
    if (userRole === 'admin') {
      socket.join('admin');
    }

    // Order tracking
    socket.on('trackOrder', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('untrackOrder', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    // Chat (stub for future)
    socket.on('typing', ({ room }: { room: string }) => {
      socket.to(room).emit('typing', { userId });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error: ${err.message}`);
    });

    // Ping-pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
};

export const getSocketServer = (): SocketIOServer | null => io;

// ─── Notification Helpers ─────────────────────────────────────────────────────

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

export const emitToVendor = (vendorId: string, event: string, data: unknown): void => {
  if (!io) return;
  io.to(`vendor:${vendorId}`).emit(event, data);
};

export const emitToAdmins = (event: string, data: unknown): void => {
  if (!io) return;
  io.to('admin').emit(event, data);
};

export const emitOrderUpdate = (orderId: string, data: unknown): void => {
  if (!io) return;
  io.to(`order:${orderId}`).emit('orderUpdate', data);
};
