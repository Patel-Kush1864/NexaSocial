import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerServiceWrapper } from '../../logger/logger.service';

export interface MediaStreamSession {
  streamId: string;
  whipEndpoint: string;
  rtmpSourceUrl: string;
  status: 'initializing' | 'active' | 'closed';
  createdAt: Date;
}

@Injectable()
export class MediaServerService {
  private activeSessions = new Map<string, MediaStreamSession>();

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerServiceWrapper,
  ) {}

  /**
   * Get Media Server host configuration
   */
  getMediaServerHost(): string {
    return (
      this.configService.get<string>('MEDIA_SERVER_HOST') || 'localhost:1935'
    );
  }

  /**
   * Get WebRTC WHIP endpoint for browser stream publishing
   */
  getWhipEndpoint(streamId: string): string {
    const host =
      this.configService.get<string>('MEDIA_SERVER_WHIP_HOST') ||
      'http://localhost:8889';
    return `${host}/live/${streamId}/whip`;
  }

  /**
   * Get local RTMP ingestion URL produced by the media server for FFmpeg forwarding
   */
  getRtmpSourceUrl(streamId: string): string {
    const rtmpHost =
      this.configService.get<string>('MEDIA_SERVER_RTMP_HOST') ||
      'rtmp://localhost:1935';
    return `${rtmpHost}/live/${streamId}`;
  }

  /**
   * Initialize a new media streaming session for a stream
   */
  createStreamSession(streamId: string): MediaStreamSession {
    const session: MediaStreamSession = {
      streamId,
      whipEndpoint: this.getWhipEndpoint(streamId),
      rtmpSourceUrl: this.getRtmpSourceUrl(streamId),
      status: 'initializing',
      createdAt: new Date(),
    };

    this.activeSessions.set(streamId, session);
    this.logger.log(
      `Media server stream session initialized for stream [${streamId}]. WHIP: ${session.whipEndpoint}`,
      'MediaServerService',
      'application',
    );

    return session;
  }

  /**
   * Activate media stream session state
   */
  activateSession(streamId: string): void {
    const session = this.activeSessions.get(streamId);
    if (session) {
      session.status = 'active';
      this.activeSessions.set(streamId, session);
    }
  }

  /**
   * Close media stream session
   */
  closeSession(streamId: string): void {
    if (this.activeSessions.has(streamId)) {
      this.activeSessions.delete(streamId);
      this.logger.log(
        `Media server stream session closed for stream [${streamId}]`,
        'MediaServerService',
        'application',
      );
    }
  }

  /**
   * Retrieve active session details
   */
  getSession(streamId: string): MediaStreamSession | undefined {
    return this.activeSessions.get(streamId);
  }
}
