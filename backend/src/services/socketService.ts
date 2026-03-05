import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server | null = null;

export function initSocketService(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function emitSessionStarted(session: unknown): void {
  getIo().emit('session:started', session);
}

export function emitSessionEnded(session: unknown): void {
  getIo().emit('session:ended', session);
}

export function emitSessionUpdated(session: unknown): void {
  getIo().emit('session:updated', session);
}

export function emitStatusUpdate(status: unknown): void {
  getIo().emit('status:update', status);
}
