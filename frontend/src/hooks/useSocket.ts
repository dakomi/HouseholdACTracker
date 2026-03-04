import { useEffect, useCallback } from 'react';
import { onSessionStarted, onSessionEnded, onSessionUpdated, onStatusUpdate } from '../api/socket';
import type { Session, StatusUpdate } from '../types';

interface SocketCallbacks {
  onSessionStarted?: (session: Session) => void;
  onSessionEnded?: (session: Session) => void;
  onSessionUpdated?: (session: Session) => void;
  onStatusUpdate?: (status: StatusUpdate) => void;
}

export function useSocket(callbacks: SocketCallbacks) {
  const { onSessionStarted: cbStart, onSessionEnded: cbEnd, onSessionUpdated: cbUpdate, onStatusUpdate: cbStatus } = callbacks;

  const stableStart = useCallback((s: Session) => cbStart?.(s), [cbStart]);
  const stableEnd = useCallback((s: Session) => cbEnd?.(s), [cbEnd]);
  const stableUpdate = useCallback((s: Session) => cbUpdate?.(s), [cbUpdate]);
  const stableStatus = useCallback((s: StatusUpdate) => cbStatus?.(s), [cbStatus]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    if (cbStart) unsubs.push(onSessionStarted(stableStart));
    if (cbEnd) unsubs.push(onSessionEnded(stableEnd));
    if (cbUpdate) unsubs.push(onSessionUpdated(stableUpdate));
    if (cbStatus) unsubs.push(onStatusUpdate(stableStatus));
    return () => unsubs.forEach((fn) => fn());
  }, [stableStart, stableEnd, stableUpdate, stableStatus, cbStart, cbEnd, cbUpdate, cbStatus]);
}
