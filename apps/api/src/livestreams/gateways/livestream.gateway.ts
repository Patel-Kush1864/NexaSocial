/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  namespace: '/streams',
})
export class LiveStreamGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(LiveStreamGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinWorkspace')
  async handleJoinWorkspace(
    @MessageBody() workspaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`workspace:${workspaceId}`);
    this.logger.log(`Client ${client.id} joined room workspace:${workspaceId}`);
    return { status: 'joined', workspaceId };
  }

  @SubscribeMessage('leaveWorkspace')
  async handleLeaveWorkspace(
    @MessageBody() workspaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`workspace:${workspaceId}`);
    this.logger.log(`Client ${client.id} left room workspace:${workspaceId}`);
    return { status: 'left', workspaceId };
  }

  emitStreamStarted(workspaceId: string, streamId: string, details: any) {
    this.server.to(`workspace:${workspaceId}`).emit('STREAM_STARTED', {
      streamId,
      details,
    });
  }

  emitStreamStopped(workspaceId: string, streamId: string) {
    this.server.to(`workspace:${workspaceId}`).emit('STREAM_STOPPED', {
      streamId,
    });
  }

  emitStreamFailed(workspaceId: string, streamId: string, error: string) {
    this.server.to(`workspace:${workspaceId}`).emit('STREAM_FAILED', {
      streamId,
      error,
    });
  }

  emitStreamEnded(workspaceId: string, streamId: string) {
    this.server.to(`workspace:${workspaceId}`).emit('STREAM_ENDED', {
      streamId,
    });
  }

  emitViewerCountUpdate(workspaceId: string, streamId: string, count: number) {
    this.server.to(`workspace:${workspaceId}`).emit('VIEWER_UPDATE', {
      streamId,
      count,
    });
  }
}
