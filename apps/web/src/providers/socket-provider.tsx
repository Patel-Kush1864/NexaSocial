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
  streamSocket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  streamSocket: null,
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
  const [streamSocket, setStreamSocket] = useState<Socket | null>(null);
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

    // Create main socket connection
    const socketInstance = io(APP_CONFIG.wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Create live stream dedicated socket connection (/streams namespace)
    const streamUrl = `${APP_CONFIG.wsUrl.replace(/\/$/, '')}/streams`;
    const streamSocketInstance = io(streamUrl, {
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

    streamSocketInstance.on('connect', () => {
      setStreamSocket(streamSocketInstance);
      if (currentWorkspace) {
        streamSocketInstance.emit('joinWorkspace', currentWorkspace.id);
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
      streamSocketInstance.disconnect();
      setSocket(null);
      setStreamSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, addNotification]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle workspace switching
  useEffect(() => {
    if (!isConnected) return;

    if (currentWorkspace) {
      if (socket) socket.emit('join:workspace', currentWorkspace.id);
      if (streamSocket) streamSocket.emit('joinWorkspace', currentWorkspace.id);
    }
  }, [currentWorkspace, isConnected, socket, streamSocket]);

  return (
    <SocketContext.Provider value={{ socket, streamSocket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
