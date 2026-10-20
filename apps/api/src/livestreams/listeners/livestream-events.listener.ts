/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { StreamCreatedEvent } from '../events/stream-created.event';
import { StreamScheduledEvent } from '../events/stream-scheduled.event';
import { StreamStartedEvent } from '../events/stream-started.event';
import { StreamStoppedEvent } from '../events/stream-stopped.event';
import { StreamEndedEvent } from '../events/stream-ended.event';
import { StreamFailedEvent } from '../events/stream-failed.event';
import { PlatformFailedEvent } from '../events/platform-failed.event';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class LiveStreamEventsListener {
  private readonly logger = new Logger(LiveStreamEventsListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) { }

  private async getStreamDetails(streamId: string): Promise<{
    title: string;
    userId: string;
    email: string;
    name: string;
  } | null> {
    try {
      const rows = await this.dataSource.query(
        `SELECT s.title, s.created_by, u.first_name, u.last_name, u.email 
         FROM \`live_streams\` s 
         JOIN \`users\` u ON s.created_by = u.id 
         WHERE s.id = ? LIMIT 1`,
        [streamId],
      );
      if (rows && rows[0]?.email) {
        const name =
          `${rows[0].first_name || ''} ${rows[0].last_name || ''}`.trim() ||
          rows[0].email.split('@')[0];
        return {
          title: rows[0].title || 'Live Stream',
          userId: rows[0].created_by,
          email: rows[0].email,
          name,
        };
      }
    } catch { }
    return null;
  }

  @OnEvent('stream.created')
  handleStreamCreated(event: StreamCreatedEvent) {
    this.logger.log(
      `Event [stream.created]: Stream "${event.title}" (ID: ${event.streamId}) created for workspace ${event.workspaceId}`,
    );
  }

  @OnEvent('stream.scheduled')
  async handleStreamScheduled(event: StreamScheduledEvent) {
    this.logger.log(
      `Event [stream.scheduled]: Stream ID ${event.streamId} scheduled for ${event.scheduledAt.toISOString()}`,
    );
    try {
      const details = await this.getStreamDetails(event.streamId);
      if (details) {
        await this.mailService.sendStreamScheduled({
          userId: details.userId,
          name: details.name,
          email: details.email,
          title: details.title,
          scheduledAt: event.scheduledAt,
          streamId: event.streamId,
        });
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to send stream scheduled email: ${err.message}`,
      );
    }
  }

  @OnEvent('stream.started')
  async handleStreamStarted(event: StreamStartedEvent) {
    this.logger.log(
      `Event [stream.started]: Stream ID ${event.streamId} went live across ${event.platformsCount} platforms`,
    );
    try {
      const details = await this.getStreamDetails(event.streamId);
      if (details) {
        await this.mailService.sendStreamStarted({
          userId: details.userId,
          name: details.name,
          email: details.email,
          title: details.title,
          platformsCount: event.platformsCount,
          streamId: event.streamId,
        });
      }
    } catch (err: any) {
      this.logger.error(`Failed to send stream started email: ${err.message}`);
    }
  }

  @OnEvent('stream.stopped')
  handleStreamStopped(event: StreamStoppedEvent) {
    this.logger.log(
      `Event [stream.stopped]: Stream ID ${event.streamId} stopped. Duration: ${event.durationSeconds ?? 'unknown'}s`,
    );
  }

  @OnEvent('stream.ended')
  handleStreamEnded(event: StreamEndedEvent) {
    this.logger.log(
      `Event [stream.ended]: Stream ID ${event.streamId} marked as ENDED at ${event.endedAt.toISOString()}`,
    );
  }

  @OnEvent('stream.failed')
  async handleStreamFailed(event: StreamFailedEvent) {
    this.logger.error(
      `Event [stream.failed]: Stream ID ${event.streamId} failed. Reason: ${event.reason}`,
    );
    try {
      const details = await this.getStreamDetails(event.streamId);
      if (details) {
        await this.mailService.sendStreamFailed({
          userId: details.userId,
          name: details.name,
          email: details.email,
          title: details.title,
          reason: event.reason,
          streamId: event.streamId,
        });
      }
    } catch (err: any) {
      this.logger.error(`Failed to send stream failed email: ${err.message}`);
    }
  }

  @OnEvent('platform.failed')
  handlePlatformFailed(event: PlatformFailedEvent) {
    this.logger.warn(
      `Event [platform.failed]: Platform ${event.platformName} for stream ID ${event.streamId} failed. Reason: ${event.reason}`,
    );
  }
}
