import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { LoggerServiceWrapper } from '../../logger/logger.service';

export interface StreamForwardOptions {
  streamId: string;
  sourceUrl: string;
  destinationUrl: string;
  streamKey: string;
  platform?: string;
}

@Injectable()
export class FFmpegService implements OnModuleDestroy {
  private activeProcesses = new Map<string, ChildProcess>();
  private headerChunks = new Map<string, Buffer>();
  private chunkCounters = new Map<string, number>();

  constructor(private readonly logger: LoggerServiceWrapper) { }

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
      `[LIVE] ${options.platform || 'Platform'} destination loaded: ${destinationUrl}`,
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
    const base = destinationUrl.replace(/\/+$/, '');
    const key = streamKey.replace(/^\/+/, '');
    const fullDestination = `${base}/${key}`;

    if (!this.validateDestinationUrl(destinationUrl, options.platform)) {
      this.logger.error(
        `[LIVE] Rejected invalid or unauthorized stream destination: ${destinationUrl}`,
        undefined,
        'FFmpegService',
      );
      throw new Error(
        `Invalid or prohibited streaming destination URL: ${destinationUrl}`,
      );
    }

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
        'webm',
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
        ...(options.platform === 'INSTAGRAM'
          ? ['-vf', 'scale=720:-1,pad=720:1280:0:(1280-ih)/2:black']
          : []),
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

      console.log(
        `\n\x1b[1;34m╔════════════════════════════════════════════════════════════════════════════════╗\n` +
        `║ [FFMPEG RELAY] Starting Stream Forwarder (${options.platform || 'Platform'})    \n` +
        `╚════════════════════════════════════════════════════════════════════════════════╝\x1b[0m\n` +
        `  • Stream ID:      ${streamId}\n` +
        `  • Binary:         ${ffmpegBinary}\n` +
        `  • Input:          pipe:0 (browser WebM binary chunks)\n` +
        `  • Destination:    ${fullDestination.replace(key, maskedKey)}\n`,
      );

      this.logger.log(
        `[LIVE] Starting ${options.platform || 'Platform'} relay: Spawning FFmpeg (${ffmpegBinary}) to relay pipe:0 to ${fullDestination.replace(key, maskedKey)}`,
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

      console.log(
        `  \x1b[32m✔ FFmpeg process started with PID ${ffmpegProc.pid || 'unknown'}\x1b[0m\n`,
      );

      this.logger.log(
        `[LIVE] FFmpeg process started with PID ${ffmpegProc.pid || 'unknown'}. FFmpeg input connected.`,
        'FFmpegService',
        'application',
      );

      // Write cached WebM EBML header if available to ensure FFmpeg parses pipe:0 correctly
      const cachedHeader = this.headerChunks.get(streamId);
      if (cachedHeader && ffmpegProc.stdin && !ffmpegProc.stdin.destroyed) {
        ffmpegProc.stdin.write(cachedHeader);
        console.log(
          `  ✔ Piped cached WebM EBML header (${cachedHeader.length} bytes) to FFmpeg stdin`,
        );
        this.logger.log(
          `[LIVE] Piped cached WebM EBML header (${cachedHeader.length} bytes) to FFmpeg stdin for stream [${streamId}]`,
          'FFmpegService',
          'application',
        );
      }

      this.logger.log(
        `[LIVE] Connecting to ${options.platform || 'Platform'}...`,
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
            console.error(
              `\x1b[31m[FFMPEG RELAY ERROR] [${streamId}]: ${msg}\x1b[0m`,
            );
            this.logger.warn(
              `[LIVE] FFmpeg error [${streamId}]: ${msg}`,
              'FFmpegService',
              'application',
            );
          } else if (msg.includes('frame=')) {
            // Periodic encoder status
            this.logger.debug(
              `[LIVE] FFmpeg status [${streamId}]: ${msg}`,
              'FFmpegService',
            );
          } else {
            console.log(`\x1b[90m[FFMPEG RELAY] [${streamId}]: ${msg}\x1b[0m`);
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
        `[LIVE] ${options.platform || 'Platform'} relay running for stream [${streamId}]`,
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
  isForwarding(streamId: string, streamKey?: string): boolean {
    if (streamKey) {
      const processKey = `${streamId}:${streamKey}`;
      return this.activeProcesses.has(processKey);
    }
    for (const key of this.activeProcesses.keys()) {
      if (key.startsWith(`${streamId}:`)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validates stream destination URL to prevent SSRF and internal network scanning.
   */
  private validateDestinationUrl(url: string, platform?: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed.startsWith('rtmp://') && !trimmed.startsWith('rtmps://')) {
      return false;
    }

    try {
      const parsed = new URL(trimmed.replace(/^rtmps?:\/\//, 'http://'));
      const host = parsed.hostname.toLowerCase();

      // Disallow local and loopback addresses
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.endsWith('.local') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      ) {
        return false;
      }

      if (platform?.toUpperCase() === 'INSTAGRAM') {
        return (
          host === 'live-upload.instagram.com' ||
          host.endsWith('.instagram.com') ||
          host.endsWith('.facebook.com') ||
          host === 'rtmp-api.facebook.com'
        );
      }

      return true;
    } catch {
      return false;
    }
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
