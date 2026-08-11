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

import { FFmpegService } from '../services/ffmpeg.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/streams',
})
export class LiveStreamGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(LiveStreamGateway.name);

  constructor(private readonly ffmpegService?: FFmpegService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('stream:binary_chunk')
  handleBinaryChunk(@MessageBody() data: { streamId: string; chunk: any }) {
    if (data?.streamId && data?.chunk && this.ffmpegService) {
      let buf: Buffer;
      if (Buffer.isBuffer(data.chunk)) {
        buf = data.chunk;
      } else if (typeof data.chunk === 'string') {
        buf = Buffer.from(data.chunk, 'base64');
      } else {
        buf = Buffer.from(data.chunk as ArrayBuffer);
      }
      this.ffmpegService.writeChunk(data.streamId, buf);
    }
  }

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
