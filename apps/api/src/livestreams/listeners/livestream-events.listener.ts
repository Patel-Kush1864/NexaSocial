import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StreamCreatedEvent } from '../events/stream-created.event';
import { StreamScheduledEvent } from '../events/stream-scheduled.event';
import { StreamStartedEvent } from '../events/stream-started.event';
import { StreamStoppedEvent } from '../events/stream-stopped.event';
import { StreamEndedEvent } from '../events/stream-ended.event';
import { StreamFailedEvent } from '../events/stream-failed.event';
import { PlatformFailedEvent } from '../events/platform-failed.event';

@Injectable()
export class LiveStreamEventsListener {
  private readonly logger = new Logger(LiveStreamEventsListener.name);

  @OnEvent('stream.created')
  handleStreamCreated(event: StreamCreatedEvent) {
    this.logger.log(
      `Event [stream.created]: Stream "${event.title}" (ID: ${event.streamId}) created for workspace ${event.workspaceId}`,
    );
  }

  @OnEvent('stream.scheduled')
  handleStreamScheduled(event: StreamScheduledEvent) {
    this.logger.log(
      `Event [stream.scheduled]: Stream ID ${event.streamId} scheduled for ${event.scheduledAt.toISOString()}`,
    );
  }

  @OnEvent('stream.started')
  handleStreamStarted(event: StreamStartedEvent) {
    this.logger.log(
      `Event [stream.started]: Stream ID ${event.streamId} went live across ${event.platformsCount} platforms`,
    );
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
  handleStreamFailed(event: StreamFailedEvent) {
    this.logger.error(
      `Event [stream.failed]: Stream ID ${event.streamId} failed. Reason: ${event.reason}`,
    );
  }

  @OnEvent('platform.failed')
  handlePlatformFailed(event: PlatformFailedEvent) {
    this.logger.warn(
      `Event [platform.failed]: Platform ${event.platformName} for stream ID ${event.streamId} failed. Reason: ${event.reason}`,
    );
  }
}
