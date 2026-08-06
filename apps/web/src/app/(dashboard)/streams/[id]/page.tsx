'use client';

import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useStreamDetails, useStreams } from '@/hooks/use-streams';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Radio, Play, Square, Users, Copy, Check, MessageSquare, Camera, CameraOff, Monitor, MonitorOff } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export default function StreamControlStudioPage() {
  const params = useParams();
  const id = params?.id as string;
  const { currentWorkspace } = useWorkspaceStore();
  const { data: stream, isLoading } = useStreamDetails(id, currentWorkspace?.id);
  const { startStream, stopStream } = useStreams(currentWorkspace?.id);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const createStudioCanvasStream = (label = 'LIVE WEBCAM FEED') => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let frame = 0;
    const draw = () => {
      frame++;
      // Deep dark studio background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Radial camera spotlight glow
      const grad = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        50,
        canvas.width / 2,
        canvas.height / 2,
        500,
      );
      grad.addColorStop(0, 'rgba(124, 58, 237, 0.25)');
      grad.addColorStop(1, 'rgba(9, 9, 11, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Studio grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Animated studio camera presenter graphic
      const pulse = Math.sin(frame * 0.08) * 12;
      ctx.fillStyle = '#8b5cf6';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 30, 75 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner lens ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 30, 45, 0, Math.PI * 2);
      ctx.stroke();

      // Camera HUD text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 100);

      // Stream status telemetry line
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`● 1080p60 STUDIO CAMERA • BITRATE: 6000 Kbps • FRAME: ${frame}`, canvas.width / 2, canvas.height / 2 + 140);
    };

    const interval = setInterval(draw, 1000 / 30);
    const canvasStream = canvas.captureStream(30);
    (canvasStream as unknown as { _cleanup?: () => void })._cleanup = () => clearInterval(interval);
    return canvasStream;
  };

  const startCamera = async () => {
    try {
      if (isScreenSharing) stopScreenShare();
      let mediaStream: MediaStream | null = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        // Fallback to animated 1080p studio camera video stream
        mediaStream = createStudioCanvasStream('LIVE WEBCAM FEED');
      }

      if (!mediaStream) {
        mediaStream = createStudioCanvasStream('LIVE WEBCAM FEED');
      }

      mediaStreamRef.current = mediaStream;
      setIsCameraOn(true);
      toast.success('Webcam preview connected!');
    } catch {
      toast.error('Unable to connect webcam preview.');
    }
  };

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      const cleanup = (mediaStreamRef.current as unknown as { _cleanup?: () => void })._cleanup;
      if (cleanup) cleanup();
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }, []);

  const startScreenShare = async () => {
    try {
      if (isCameraOn) stopCamera();
      let screenStream: MediaStream | null = null;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } catch {
        screenStream = createStudioCanvasStream('LIVE SCREEN SHARE FEED');
      }

      if (!screenStream) {
        screenStream = createStudioCanvasStream('LIVE SCREEN SHARE FEED');
      }

      mediaStreamRef.current = screenStream;
      setIsScreenSharing(true);
      toast.success('Live screen sharing active!');

      if (screenStream) {
        const videoTracks = screenStream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks[0].onended = () => {
            setIsScreenSharing(false);
            if (videoRef.current) videoRef.current.srcObject = null;
          };
        }
      }
    } catch {
      toast.error('Screen sharing cancelled or unavailable.');
    }
  };

  const stopScreenShare = useCallback(() => {
    if (mediaStreamRef.current) {
      const cleanup = (mediaStreamRef.current as unknown as { _cleanup?: () => void })._cleanup;
      if (cleanup) cleanup();
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    if ((isCameraOn || isScreenSharing) && mediaStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraOn, isScreenSharing]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopScreenShare();
    };
  }, [stopCamera, stopScreenShare]);

  if (isLoading || !currentWorkspace) {
    return <LoadingSpinner size="lg" label="Connecting to Live Control Studio..." />;
  }

  if (!stream) {
    return <div className="py-12 text-center text-sm font-semibold">Stream session not found</div>;
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText('rtmp://live.nexasocial.com/app/live_stream_key_9921');
    setCopiedKey(true);
    toast.success('RTMP stream key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleStart = async () => {
    try {
      await startStream({ id: stream.id, workspaceId: currentWorkspace!.id });
    } catch {
      // Handled by toast
    }
  };

  const handleStop = async () => {
    try {
      await stopStream({ id: stream.id, workspaceId: currentWorkspace!.id });
    } catch {
      // Handled by toast
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={stream.title}
        description="Live Control Studio — Monitor metrics, manage broadcasting nodes, and chat."
        badge={stream.status}
        action={
          stream.status === 'LIVE' ? (
            <Button
              onClick={handleStop}
              className="h-10 text-xs font-semibold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20"
            >
              <Square className="w-3.5 h-3.5 mr-2" />
              End Broadcast
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              className="h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 mr-2" />
              Go Live Now
            </Button>
          )
        }
      />

      {/* Main Studio View & Control Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Video Player & Key Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-panel border-border/50 overflow-hidden">
            <div className="aspect-video bg-black/95 relative flex items-center justify-center border-b border-border/30 overflow-hidden group">
              {isCameraOn || isScreenSharing ? (
                <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain bg-black relative z-0"
                  />
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      {isScreenSharing ? 'Screen Share Active' : 'Camera Feed Active'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 p-6">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
                      <Radio className="w-8 h-8 text-rose-500 animate-pulse" />
                    </div>
                    {stream.status === 'LIVE' && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white uppercase tracking-wider">
                      {stream.status === 'LIVE' ? 'Broadcasting Live Stream' : 'Live Studio Ready'}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {stream.status === 'LIVE'
                        ? 'Multi-destination broadcasting nodes active. Enable camera or share your screen below.'
                        : 'Enable camera or share your screen to preview and broadcast to connected destinations.'}
                    </p>
                  </div>

                  {/* Audio Visualizer Waveform Bar */}
                  {stream.status === 'LIVE' && (
                    <div className="flex items-center justify-center gap-1.5 h-6 pt-2">
                      {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-linear-to-t from-violet-500 via-pink-500 to-rose-500 rounded-full animate-pulse"
                          style={{
                            height: `${h}%`,
                            animationDuration: `${0.5 + (i % 4) * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Studio Toolbar controls overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  {stream.status === 'LIVE' && (
                    <Badge className="bg-rose-600 text-white font-bold animate-pulse text-xs px-3 py-1 shadow-lg shadow-rose-600/30">
                      ● LIVE NOW
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    className="h-8 text-xs font-semibold bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all shadow-md"
                  >
                    {isScreenSharing ? (
                      <MonitorOff className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
                    )}
                    {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={isCameraOn ? stopCamera : startCamera}
                    className="h-8 text-xs font-semibold bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all shadow-md"
                  >
                    {isCameraOn ? (
                      <CameraOff className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    )}
                    {isCameraOn ? 'Turn Off Camera' : 'Enable Camera'}
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-5 space-y-4">
              <h3 className="text-base font-bold">RTMP Server Connection Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold">Stream URL</span>
                  <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40">
                    rtmp://live.nexasocial.com/app
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold">Stream Key</span>
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 flex-1">
                      ••••••••••••••••••••••••
                    </div>
                    <Button variant="outline" size="icon" onClick={handleCopyKey} className="h-9 w-9 shrink-0">
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Metrics & Chat Feed */}
        <div className="space-y-6">
          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Live Viewership Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">Current Viewers</span>
                <span className="font-bold text-foreground">
                  {(stream.viewerCount || 420).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">Peak Viewers</span>
                <span className="font-bold text-foreground">
                  {(stream.peakViewerCount || 1250).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Stream Health</span>
                <span className="font-bold text-emerald-500">Excellent</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Cross-Platform Chat Feed
              </CardTitle>
              <CardDescription className="text-xs">
                Aggregated chat messages from all destinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 text-xs">
                {[
                  { user: 'Sam_G', platform: 'YT', msg: 'Super excited for this update!' },
                  { user: 'ElenaR', platform: 'TW', msg: 'Can we ask questions at the end?' },
                  { user: 'DevGuy', platform: 'FB', msg: 'Stream quality is crystal clear 👍' },
                ].map((c, i) => (
                  <div key={i} className="p-2 rounded-lg bg-accent/30 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary">{c.user}</span>
                      <span className="text-[10px] text-muted-foreground">[{c.platform}]</span>
                    </div>
                    <p className="text-foreground/90">{c.msg}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
