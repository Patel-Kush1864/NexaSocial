import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import { LoggerServiceWrapper } from '../../logger/logger.service';

export interface StreamForwardOptions {
  streamId: string;
  sourceUrl: string;
  destinationUrl: string;
  streamKey: string;
  platform?: string;
}

export interface RelayDiagnostics {
  streamId: string;
  pid?: number;
  isProcessRunning: boolean;
  exitCode: number | null;
  exitSignal: string | null;
  framesTransmitted: boolean;
  transmittedChunks: number;
  lastTransmissionTime: Date | null;
  lastRtmpError: string | null;
  recentStderr: string[];
}

@Injectable()
export class FFmpegService implements OnModuleDestroy {
  private activeProcesses = new Map<string, ChildProcess>();
  private headerChunks = new Map<string, Buffer>();
  private chunkCounters = new Map<string, number>();
  private lastFrameTimes = new Map<string, Date>();
  private lastExitCodes = new Map<
    string,
    { code: number | null; signal: string | null; at: Date }
  >();
  private recentStderrLogs = new Map<string, string[]>();
  private lastRtmpErrors = new Map<string, string>();
  private processPids = new Map<string, number>();
  private processPlatforms = new Map<string, string>();

  constructor(private readonly logger: LoggerServiceWrapper) { }

  /**
   * Sanitizes text removing any stream keys, query parameters, or sensitive URL parts.
   */
  sanitizeStderr(text: string): string {
    if (!text) return '';
    return text
      .replace(/rtmps?:\/\/[^\s]+/gi, (url) => {
        try {
          const u = new URL(url.replace(/^rtmps?:\/\//, 'http://'));
          return `rtmps://${u.host}/••••••••`;
        } catch {
          return 'rtmps://••••••••';
        }
      })
      .replace(/([?&][a-zA-Z0-9_\-]+)=([^&\s]+)/g, '$1=••••••••')
      .replace(/([0-9a-zA-Z]{16,})/g, (match) => {
        return `${match.slice(0, 4)}••••••••`;
      });
  }

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
   * Resolves the FFmpeg executable binary with multiple fallback strategies:
   * 1. FFMPEG_PATH environment variable
   * 2. Winget Gyan package default installation path
   * 3. ffmpeg-static npm package
   * 4. System PATH 'ffmpeg'
   */
  resolveFFmpegBinary(): string {
    const envPath = (process.env.FFMPEG_PATH || '')
      .replace(/^["']|["']$/g, '')
      .trim();
    if (envPath && fs.existsSync(envPath)) {
      return envPath;
    }

    const wingetGyanPath =
      'C:\\Users\\Patel Kush\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
    if (fs.existsSync(wingetGyanPath)) {
      return wingetGyanPath;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const staticPath: unknown = require('ffmpeg-static');
      if (staticPath && typeof staticPath === 'string' && fs.existsSync(staticPath)) {
        return staticPath;
      }
    } catch {
      // Fallback
    }

    return 'ffmpeg';
  }

  /**
   * Start forwarding a stream to a remote platform using FFmpeg.
   * Safe and idempotent: reuses active running processes and avoids duplicate workers.
   */
  startForwarding(options: StreamForwardOptions): boolean {
    const { streamId, sourceUrl, destinationUrl, streamKey } = options;
    const processKey = `${streamId}:${streamKey}`;

    const existingProc = this.activeProcesses.get(processKey);
    if (existingProc && !existingProc.killed && existingProc.exitCode === null) {
      console.log(
        `[INSTAGRAM_LIVE][RELAY] action=reuse streamId=${streamId} pid=${existingProc.pid} platform=${options.platform || 'Platform'}`,
      );
      this.logger.log(
        `[INSTAGRAM_LIVE][RELAY] action=reuse streamId=${streamId} pid=${existingProc.pid}`,
        'FFmpegService',
        'application',
      );
      return true;
    } else if (existingProc) {
      this.activeProcesses.delete(processKey);
    }

    // Clean up any stale/conflicting workers for the SAME platform on this stream before spawning
    const currentPlatform = (options.platform || '').toUpperCase();
    for (const [key, proc] of this.activeProcesses.entries()) {
      if (key.startsWith(`${streamId}:`) && key !== processKey) {
        const procPlatform = (this.processPlatforms.get(key) || '').toUpperCase();
        // Only stop if they belong to the same platform (e.g. replacing an old key on the same platform)
        if (currentPlatform && procPlatform && currentPlatform === procPlatform) {
          console.log(
            `[LIVE][RELAY] action=stop_conflict streamId=${streamId} staleKey=${key} platform=${currentPlatform} reason=new_relay_started caller=startForwarding`,
          );
          proc.kill('SIGTERM');
          this.activeProcesses.delete(key);
          this.processPlatforms.delete(key);
        }
      }
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
      return false;
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
          ? ['-vf', 'scale=720:-2,pad=720:1280:0:(1280-ih)/2:black']
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
      const ffmpegBinary = this.resolveFFmpegBinary();

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

      console.log(
        `[INSTAGRAM_LIVE][RELAY] action=start streamId=${streamId} pid=${ffmpegProc.pid || 'unknown'} platform=${options.platform || 'Platform'}`,
      );

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
        const raw = String(data).trim();
        if (!raw) return;
        const sanitized = this.sanitizeStderr(raw);

        const recent = this.recentStderrLogs.get(streamId) || [];
        recent.push(sanitized);
        if (recent.length > 20) recent.shift();
        this.recentStderrLogs.set(streamId, recent);

        if (/error|failed|fatal alert|connection refused|broken pipe|i\/o error/i.test(sanitized)) {
          this.lastRtmpErrors.set(streamId, sanitized);
          console.error(
            `\x1b[31m[FFMPEG RELAY ERROR] [${streamId}]: ${sanitized}\x1b[0m`,
          );
          this.logger.warn(
            `[LIVE] FFmpeg error [${streamId}]: ${sanitized}`,
            'FFmpegService',
            'application',
          );
        } else if (sanitized.includes('frame=')) {
          // Periodic encoder status
          this.logger.debug(
            `[LIVE] FFmpeg status [${streamId}]: ${sanitized}`,
            'FFmpegService',
          );
        } else {
          console.log(`\x1b[90m[FFMPEG RELAY] [${streamId}]: ${sanitized}\x1b[0m`);
          this.logger.log(
            `[LIVE] FFmpeg status [${streamId}]: ${sanitized}`,
            'FFmpegService',
            'application',
          );
        }
      });

      ffmpegProc.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
        this.lastExitCodes.set(streamId, {
          code,
          signal: signal ? String(signal) : null,
          at: new Date(),
        });
        console.log(
          `[INSTAGRAM_LIVE][RELAY] action=exit streamId=${streamId} pid=${ffmpegProc.pid} code=${String(code)} signal=${String(signal)}`,
        );
        this.logger.log(
          `[LIVE] FFmpeg process for stream [${streamId}] exited with code ${String(code)} signal ${String(signal)}`,
          'FFmpegService',
          'application',
        );
        this.activeProcesses.delete(processKey);
        this.processPlatforms.delete(processKey);
      });

      ffmpegProc.on('error', (err: Error) => {
        console.error(
          `[INSTAGRAM_LIVE][RELAY] action=spawn_error streamId=${streamId} error="${err.message}"`,
        );
        this.logger.warn(
          `[LIVE] FFmpeg spawn error [${streamId}]: ${err.message}`,
          'FFmpegService',
          'application',
        );
        this.activeProcesses.delete(processKey);
        this.processPlatforms.delete(processKey);
      });

      this.activeProcesses.set(processKey, ffmpegProc);
      if (options.platform) {
        this.processPlatforms.set(processKey, options.platform);
      }
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
      this.lastFrameTimes.set(streamId, new Date());
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
   * Stop forwarding for a specific stream and destination key with caller and reason attribution.
   */
  stopForwarding(
    streamId: string,
    streamKey?: string,
    reason = 'unspecified',
    caller = 'unknown',
  ): void {
    console.log(
      `[INSTAGRAM_LIVE][RELAY] action=stop streamId=${streamId} targetKey=${streamKey ? 'specific' : 'all'} reason=${reason} caller=${caller}`,
    );
    this.logger.log(
      `[INSTAGRAM_LIVE][RELAY] action=stop streamId=${streamId} targetKey=${streamKey ? 'specific' : 'all'} reason=${reason} caller=${caller}`,
      'FFmpegService',
      'application',
    );

    if (streamKey) {
      const processKey = `${streamId}:${streamKey}`;
      const proc = this.activeProcesses.get(processKey);
      if (proc) {
        proc.kill('SIGTERM');
        this.activeProcesses.delete(processKey);
        this.processPlatforms.delete(processKey);
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
          this.processPlatforms.delete(key);
          this.logger.log(
            `Stopped FFmpeg relay process for ${key}`,
            'FFmpegService',
            'application',
          );
        }
      }
    }

    if (!this.isForwarding(streamId)) {
      this.chunkCounters.delete(streamId);
      this.headerChunks.delete(streamId);
    }
  }

  /**
   * Check if a stream relay process is running and actively alive.
   */
  isForwarding(streamId: string, streamKey?: string): boolean {
    if (streamKey) {
      const processKey = `${streamId}:${streamKey}`;
      const proc = this.activeProcesses.get(processKey);
      if (proc) {
        if (!proc.killed && proc.exitCode === null) {
          return true;
        }
        this.activeProcesses.delete(processKey);
      }
      return false;
    }
    for (const [key, proc] of this.activeProcesses.entries()) {
      if (key.startsWith(`${streamId}:`)) {
        if (!proc.killed && proc.exitCode === null) {
          return true;
        }
        this.activeProcesses.delete(key);
      }
    }
    return false;
  }

  /**
   * Returns the count of video/audio chunks successfully piped to FFmpeg for a stream.
   */
  getTransmittedChunkCount(streamId: string): number {
    return this.chunkCounters.get(streamId) || 0;
  }

  /**
   * Checks whether video frames have actually been piped to FFmpeg for this stream.
   */
  isTransmittingFrames(streamId: string): boolean {
    return (this.chunkCounters.get(streamId) || 0) > 0;
  }

  /**
   * Last successful transmission timestamp for a stream.
   */
  getLastTransmissionTime(streamId: string): Date | null {
    return this.lastFrameTimes.get(streamId) || null;
  }

  /**
   * Returns safe structured diagnostics for a stream relay without exposing credentials.
   */
  getRelayDiagnostics(streamId: string): RelayDiagnostics {
    const isRunning = this.isForwarding(streamId);
    let pid: number | undefined;
    for (const [key, proc] of this.activeProcesses.entries()) {
      if (key.startsWith(`${streamId}:`) && proc.pid && !proc.killed && proc.exitCode === null) {
        pid = proc.pid;
        break;
      }
    }
    const lastExit = this.lastExitCodes.get(streamId);
    const chunkCount = this.chunkCounters.get(streamId) || 0;
    const lastTime = this.lastFrameTimes.get(streamId) || null;
    const recentStderr = this.recentStderrLogs.get(streamId) || [];
    const lastError = this.lastRtmpErrors.get(streamId) || null;

    return {
      streamId,
      pid,
      isProcessRunning: isRunning,
      exitCode: isRunning ? null : (lastExit?.code ?? null),
      exitSignal: isRunning ? null : (lastExit?.signal ?? null),
      framesTransmitted: chunkCount > 0,
      transmittedChunks: chunkCount,
      lastTransmissionTime: lastTime,
      lastRtmpError: lastError,
      recentStderr: recentStderr.slice(-5),
    };
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
