'use client';

// ═══════════════════════════════════════════
// NexaSocial — Socket Event Hook
// ═══════════════════════════════════════════

import { useEffect } from 'react';
import { useSocketContext } from '@/providers/socket-provider';

export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void,
) {
  const { socket, isConnected } = useSocketContext();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, isConnected, event, handler]);

  return { isConnected };
}
