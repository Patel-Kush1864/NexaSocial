import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { LoggerServiceWrapper } from '../../logger/logger.service';

export interface StreamForwardOptions {
  streamId: string;
  sourceUrl: string;
  destinationUrl: string;
  streamKey: string;
}

@Injectable()
export class FFmpegService implements OnModuleDestroy {
  private activeProcesses = new Map<string, ChildProcess>();
  private headerChunks = new Map<string, Buffer>();
  private chunkCounters = new Map<string, number>();

  constructor(private readonly logger: LoggerServiceWrapper) {}

  /**
   * Check if a buffer starts with WebM/EBML header (0x1A 0x45 0xDF 0xA3)
   */
  private isEbmlHeader(buf: Buffer): boolean {
    return (
      buf.length >= 4 &&
      buf[0] === 0x1a &&
      buf[1] === 0x45 &&
      buf[2] === 0xdf &&
      buf[3] === 0xa3
    );
  }

  /**
   * Start forwarding a stream to a remote platform using FFmpeg.
   */
  startForwarding(options: StreamForwardOptions): boolean {
    const { streamId, sourceUrl, destinationUrl, streamKey } = options;
    const processKey = `${streamId}:${streamKey}`;

    if (this.activeProcesses.has(processKey)) {
      this.logger.warn(
        `FFmpeg process for ${processKey} is already active.`,
        'FFmpegService',
        'application',
      );
      return true;
    }

    this.logger.log(
      `[LIVE] Go Live request received for stream ID: ${streamId}`,
      'FFmpegService',
      'application',
    );
    this.logger.log(
      `[LIVE] YouTube destination loaded: ${destinationUrl}`,
      'FFmpegService',
      'application',
    );
    this.logger.log(
      `[LIVE] Media server input: pipe:0 (WebSocket binary stream)`,
      'FFmpegService',
      'application',
    );

    const maskedKey =
      streamKey.length > 8
        ? `${streamKey.substring(0, 4)}••••••••`
        : '••••••••';
    const fullDestination = destinationUrl.endsWith('/')
      ? `${destinationUrl}${streamKey}`
      : `${destinationUrl}/${streamKey}`;

    let args: string[];
    if (
      sourceUrl === 'pipe:0' ||
      sourceUrl.includes('localhost') ||
      sourceUrl.includes('pipe')
    ) {
      args = [
        '-loglevel',
        'warning',
        '-f',
        'matroska,webm',
        '-i',
        'pipe:0',
        '-c:v',
        'libx264',
        '-preset',
        'ultrafast',
        '-tune',
        'zerolatency',
        '-pix_fmt',
        'yuv420p',
        '-r',
        '30',
        '-g',
        '60',
        '-b:v',
        '2500k',
        '-maxrate',
        '3000k',
        '-bufsize',
        '6000k',
        '-c:a',
        'aac',
        '-ar',
        '44100',
        '-b:a',
        '128k',
        '-f',
        'flv',
        fullDestination,
      ];
    } else {
      args = [
        '-loglevel',
        'warning',
        '-re',
        '-i',
        sourceUrl,
        '-c:v',
        'copy',
        '-c:a',
        'copy',
        '-f',
        'flv',
        fullDestination,
      ];
    }

    try {
      let ffmpegBinary = 'ffmpeg';
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const staticPath: unknown = require('ffmpeg-static');
        if (staticPath && typeof staticPath === 'string') {
          ffmpegBinary = staticPath;
        }
      } catch {
        // Fallback to system ffmpeg
      }

      this.logger.log(
        `[LIVE] Starting YouTube relay: Spawning FFmpeg (${ffmpegBinary}) to relay pipe:0 to ${destinationUrl}/${maskedKey}`,
        'FFmpegService',
        'application',
      );

      const ffmpegProc = spawn(ffmpegBinary, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (ffmpegProc.stdin) {
        ffmpegProc.stdin.on('error', (err: Error) => {
          this.logger.debug(
            `[LIVE] FFmpeg stdin notice [${streamId}]: ${err.message}`,
            'FFmpegService',
          );
        });
      }

      this.logger.log(
        `[LIVE] FFmpeg process started with PID ${ffmpegProc.pid || 'unknown'}. FFmpeg input connected.`,
        'FFmpegService',
        'application',
      );

      // Write cached WebM EBML header if available to ensure FFmpeg parses pipe:0 correctly
      const cachedHeader = this.headerChunks.get(streamId);
      if (cachedHeader && ffmpegProc.stdin && !ffmpegProc.stdin.destroyed) {
        ffmpegProc.stdin.write(cachedHeader);
        this.logger.log(
          `[LIVE] Piped cached WebM EBML header (${cachedHeader.length} bytes) to FFmpeg stdin for stream [${streamId}]`,
          'FFmpegService',
          'application',
        );
      }

      this.logger.log(
        `[LIVE] Connecting to YouTube...`,
        'FFmpegService',
        'application',
      );

      ffmpegProc.stdout?.on('data', (data: Buffer | string) => {
        const text = String(data);
        this.logger.debug(
          `[LIVE] FFmpeg stdout [${streamId}]: ${text}`,
          'FFmpegService',
        );
      });

      ffmpegProc.stderr?.on('data', (data: Buffer | string) => {
        const msg = String(data).trim();
        if (msg) {
          if (/error|failed/i.test(msg)) {
            this.logger.warn(
              `[LIVE] FFmpeg error [${streamId}]: ${msg}`,
              'FFmpegService',
              'application',
            );
          } else {
            this.logger.log(
              `[LIVE] FFmpeg status [${streamId}]: ${msg}`,
              'FFmpegService',
              'application',
            );
          }
        }
      });

      ffmpegProc.on('close', (code: number | null) => {
        this.logger.log(
          `[LIVE] FFmpeg process for stream [${streamId}] exited with code ${String(code)}`,
          'FFmpegService',
          'application',
        );
        this.activeProcesses.delete(processKey);
      });

      ffmpegProc.on('error', (err: Error) => {
        this.logger.warn(
          `[LIVE] FFmpeg spawn error [${streamId}]: ${err.message}`,
          'FFmpegService',
          'application',
        );
        this.activeProcesses.delete(processKey);
      });

      this.activeProcesses.set(processKey, ffmpegProc);
      this.logger.log(
        `[LIVE] YouTube relay running for stream [${streamId}]`,
        'FFmpegService',
        'application',
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `[LIVE] Failed to start FFmpeg for stream ${streamId}: ${msg}`,
        'FFmpegService',
        'application',
      );
      return false;
    }
  }

  /**
   * Write binary chunk to active FFmpeg process stdin
   */
  writeChunk(streamId: string, chunk: Buffer): boolean {
    if (this.isEbmlHeader(chunk) || !this.headerChunks.has(streamId)) {
      this.headerChunks.set(streamId, chunk);
    }

    let written = false;
    for (const [key, proc] of this.activeProcesses.entries()) {
      if (key.startsWith(`${streamId}:`)) {
        if (proc.stdin && !proc.stdin.destroyed) {
          proc.stdin.write(chunk);
          written = true;
        }
      }
    }

    if (written) {
      const count = (this.chunkCounters.get(streamId) || 0) + 1;
      this.chunkCounters.set(streamId, count);
      if (count === 1 || count % 30 === 0) {
        this.logger.log(
          `[LIVE] Video/audio frames received: Piped media chunk #${count} (${chunk.length} bytes) to FFmpeg stdin for stream [${streamId}]`,
          'FFmpegService',
          'application',
        );
      }
    }
    return written;
  }

  /**
   * Stop forwarding for a specific stream and destination key.
   */
  stopForwarding(streamId: string, streamKey?: string): void {
    if (streamKey) {
      const processKey = `${streamId}:${streamKey}`;
      const proc = this.activeProcesses.get(processKey);
      if (proc) {
        proc.kill('SIGTERM');
        this.activeProcesses.delete(processKey);
        this.logger.log(
          `Stopped FFmpeg relay process for ${processKey}`,
          'FFmpegService',
          'application',
        );
      }
    } else {
      // Kill all processes matching the streamId prefix
      for (const [key, proc] of this.activeProcesses.entries()) {
        if (key.startsWith(`${streamId}:`)) {
          proc.kill('SIGTERM');
          this.activeProcesses.delete(key);
          this.logger.log(
            `Stopped FFmpeg relay process for ${key}`,
            'FFmpegService',
            'application',
          );
        }
      }
    }
  }

  /**
   * Check if a stream relay process is running.
   */
  isForwarding(streamId: string, streamKey: string): boolean {
    const processKey = `${streamId}:${streamKey}`;
    return this.activeProcesses.has(processKey);
  }

  onModuleDestroy() {
    this.logger.log(
      'Shutting down all active FFmpeg relay processes...',
      'FFmpegService',
      'application',
    );
    for (const [key, proc] of this.activeProcesses.entries()) {
      proc.kill('SIGKILL');
      this.activeProcesses.delete(key);
    }
  }
}
