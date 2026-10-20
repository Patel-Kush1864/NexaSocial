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
  implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(LiveStreamGateway.name);
  private chunkCounters = new Map<string, number>();

  constructor(private readonly ffmpegService?: FFmpegService) { }

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

      const count = (this.chunkCounters.get(data.streamId) || 0) + 1;
      this.chunkCounters.set(data.streamId, count);

      if (count === 1) {
        console.log(
          `\x1b[1;32m[WS INGEST] First browser camera/screen chunk received!\x1b[0m\n` +
          `  • Stream ID:  ${data.streamId}\n` +
          `  • Chunk Size: ${buf.length} bytes\n` +
          `  • Action:     Forwarding to FFmpeg relay stdin\n`,
        );
      } else if (count % 30 === 0) {
        console.log(
          `\x1b[32m[WS INGEST]\x1b[0m Received chunk #${count} (${buf.length} bytes) for stream [${data.streamId}] -> FFmpeg stdin`,
        );
      }

      this.ffmpegService.writeChunk(data.streamId, buf);
    }
  }

  handleConnection(client: Socket) {
    console.log(`\x1b[90m[WS] Client connected: ${client.id}\x1b[0m`);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`\x1b[90m[WS] Client disconnected: ${client.id}\x1b[0m`);
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
