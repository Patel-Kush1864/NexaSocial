'use client';

// ═══════════════════════════════════════════
// NexaSocial — Socket.IO Provider
// ═══════════════════════════════════════════

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useNotificationStore } from '@/stores/notification-store';
import { getAccessToken } from '@/lib/api-client';
import { APP_CONFIG, WS_EVENTS } from '@/lib/constants';
import type { Notification } from '@/types';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function useSocketContext() {
  return useContext(SocketContext);
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    // Create socket connection
    const socketInstance = io(APP_CONFIG.wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setSocket(socketInstance);

      if (currentWorkspace) {
        socketInstance.emit('join:workspace', currentWorkspace.id);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for real-time notifications
    socketInstance.on(WS_EVENTS.NOTIFICATION_NEW, (notification: Notification) => {
      addNotification(notification);
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, addNotification]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle workspace switching
  useEffect(() => {
    if (!socket || !isConnected) return;

    if (currentWorkspace) {
      socket.emit('join:workspace', currentWorkspace.id);
    }
  }, [currentWorkspace, isConnected, socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
