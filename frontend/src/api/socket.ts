import { io, Socket } from 'socket.io-client';
import type { Session, StatusUpdate } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export type SessionEventCallback = (session: Session) => void;
export type StatusUpdateCallback = (status: StatusUpdate) => void;

export function onSessionStarted(cb: SessionEventCallback): () => void {
  const s = getSocket();
  s.on('session:started', cb);
  return () => s.off('session:started', cb);
}

export function onSessionEnded(cb: SessionEventCallback): () => void {
  const s = getSocket();
  s.on('session:ended', cb);
  return () => s.off('session:ended', cb);
}

export function onSessionUpdated(cb: SessionEventCallback): () => void {
  const s = getSocket();
  s.on('session:updated', cb);
  return () => s.off('session:updated', cb);
}

export function onStatusUpdate(cb: StatusUpdateCallback): () => void {
  const s = getSocket();
  s.on('status:update', cb);
  return () => s.off('status:update', cb);
}
