import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Notification WebSocket Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification WebSocket Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinUserRoom')
  async handleJoinUserRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`user:${userId}`);
    this.logger.log(`Client ${client.id} joined user:${userId}`);
    return { status: 'joined', userRoom: `user:${userId}` };
  }

  @SubscribeMessage('joinWorkspaceRoom')
  async handleJoinWorkspaceRoom(
    @MessageBody() workspaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`workspace:${workspaceId}`);
    this.logger.log(`Client ${client.id} joined workspace:${workspaceId}`);
    return { status: 'joined', workspaceRoom: `workspace:${workspaceId}` };
  }

  emitNewNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('NEW_NOTIFICATION', notification);
  }

  emitWorkspaceEvent(workspaceId: string, eventName: string, payload: any) {
    this.server.to(`workspace:${workspaceId}`).emit(eventName, payload);
  }
}
