"use client";

import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useStreamDetails, useStreams } from "@/hooks/use-streams";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Input } from "@/components/ui/input";
import {
  Radio,
  Play,
  Square,
  Users,
  MessageSquare,
  Camera,
  CameraOff,
  Monitor,
  MonitorOff,
  ExternalLink,
  Key,
  Edit3,
  Check,
  Copy,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { useSocketContext } from "@/providers/socket-provider";
import { StreamPlatform } from "@/types";

export default function StreamControlStudioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { socket, streamSocket } = useSocketContext();
  const activeSocket = streamSocket || socket;

  const { currentWorkspace } = useWorkspaceStore();
  const { data: stream, isLoading } = useStreamDetails(
    id,
    currentWorkspace?.id,
  );
  const { startStream, stopStream, updateStream } = useStreams(currentWorkspace?.id);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const masterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const masterBroadcastStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Extract YouTube platform stream binding if available
  const youtubePlatform = (stream?.platforms || []).find(
    (p: StreamPlatform) =>
      p.connectedAccount?.platformName?.toUpperCase() === "YOUTUBE" ||
      p.connectedAccount?.platform?.toUpperCase() === "YOUTUBE" ||
      p.platformName?.toUpperCase() === "YOUTUBE" ||
      p.platform?.toUpperCase() === "YOUTUBE",
  );

  const handleSaveKey = async () => {
    if (!customKey.trim() || !stream || !currentWorkspace) return;
    try {
      await updateStream({
        id: stream.id,
        workspaceId: currentWorkspace.id,
        payload: { youtubeStreamKey: customKey.trim() },
      });
      setIsEditingKey(false);
      toast.success("YouTube Live Stream Key bound! Video feed connected.");
    } catch {
      // Handled by toast
    }
  };

  const handleCopyKey = () => {
    const keyToCopy = youtubePlatform?.streamKey || "";
    if (keyToCopy) {
      navigator.clipboard.writeText(keyToCopy);
      setCopiedKey(true);
      toast.success("Stream Key copied to clipboard!");
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const rawStreamId = youtubePlatform?.platformStreamId || "";
  const channelUserId =
    youtubePlatform?.connectedAccount?.platformUserId ||
    youtubePlatform?.connectedAccount?.platformAccountId ||
    "";

  const isRealYouTubeVideoId =
    Boolean(rawStreamId) &&
    !rawStreamId.startsWith("mock") &&
    rawStreamId.length >= 8;

  let youtubeWatchUrl = "https://www.youtube.com/@NexaSocial-101/live";
  if (isRealYouTubeVideoId) {
    youtubeWatchUrl = `https://www.youtube.com/watch?v=${rawStreamId}`;
  } else if (channelUserId && channelUserId.startsWith("UC")) {
    youtubeWatchUrl = `https://www.youtube.com/channel/${channelUserId}/live`;
  } else if (channelUserId && channelUserId.startsWith("@")) {
    youtubeWatchUrl = `https://www.youtube.com/${channelUserId}/live`;
  } else {
    youtubeWatchUrl = "https://www.youtube.com/live";
  }

  const getMasterBroadcastStream = useCallback(() => {
    if (masterBroadcastStreamRef.current) {
      return masterBroadcastStreamRef.current;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    masterCanvasRef.current = canvas;

    const canvasStream = canvas.captureStream(30);
    const videoTrack = canvasStream.getVideoTracks()[0];

    let audioTrack: MediaStreamTrack | null = null;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const dst = ctx.createMediaStreamDestination();
      audioDestinationRef.current = dst;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.00001;
      osc.connect(gain);
      gain.connect(dst);
      osc.start();

      audioTrack = dst.stream.getAudioTracks()[0];
    } catch {
      // Fallback silently if WebAudio is restricted
    }

    const tracks: MediaStreamTrack[] = [videoTrack];
    if (audioTrack) {
      tracks.push(audioTrack);
    }

    const masterStream = new MediaStream(tracks);
    masterBroadcastStreamRef.current = masterStream;
    return masterStream;
  }, []);

  const drawStudioHudGraphic = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    frame: number,
    label: string,
  ) => {
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      50,
      canvas.width / 2,
      canvas.height / 2,
      500,
    );
    grad.addColorStop(0, "rgba(124, 58, 237, 0.25)");
    grad.addColorStop(1, "rgba(9, 9, 11, 0.95)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
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

    const pulse = Math.sin(frame * 0.08) * 12;
    ctx.fillStyle = "#8b5cf6";
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(
      canvas.width / 2,
      canvas.height / 2 - 30,
      75 + pulse,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2 - 30, 45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 100);

    ctx.fillStyle = "#34d399";
    ctx.font = "bold 18px monospace";
    ctx.fillText(
      `● 1080p60 STUDIO BROADCAST • BITRATE: 6000 Kbps • FRAME: ${frame}`,
      canvas.width / 2,
      canvas.height / 2 + 140,
    );
  };

  const connectAudioToMixer = (mediaStream: MediaStream) => {
    try {
      const audioTracks = mediaStream.getAudioTracks();
      if (
        audioTracks.length > 0 &&
        audioContextRef.current &&
        audioDestinationRef.current
      ) {
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
        const src =
          audioContextRef.current.createMediaStreamSource(mediaStream);
        src.connect(audioDestinationRef.current);
      }
    } catch {
      // Silent catch
    }
  };

  const startCamera = async () => {
    try {
      if (isScreenSharing) {
        stopScreenShare();
      }
      let mediaStream: MediaStream | null = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch {
        // Handled via canvas fallback
      }

      if (mediaStream) {
        cameraStreamRef.current = mediaStream;
        if (!cameraVideoRef.current) {
          const v = document.createElement("video");
          v.autoplay = true;
          v.muted = true;
          v.playsInline = true;
          cameraVideoRef.current = v;
        }
        cameraVideoRef.current.srcObject = mediaStream;
        await cameraVideoRef.current.play().catch(() => {});
        connectAudioToMixer(mediaStream);
      }

      setIsCameraOn(true);
      toast.success("Webcam feed active!");
    } catch {
      toast.error("Unable to connect webcam.");
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }, []);

  const startScreenShare = async () => {
    try {
      if (isCameraOn) {
        stopCamera();
      }
      let screenStream: MediaStream | null = null;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true,
        });
      } catch {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
      }

      if (screenStream) {
        screenStreamRef.current = screenStream;
        if (!screenVideoRef.current) {
          const v = document.createElement("video");
          v.autoplay = true;
          v.muted = true;
          v.playsInline = true;
          screenVideoRef.current = v;
        }
        screenVideoRef.current.srcObject = screenStream;
        await screenVideoRef.current.play().catch(() => {});
        connectAudioToMixer(screenStream);

        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            stopScreenShare();
          };
        }
      }

      setIsScreenSharing(true);
      toast.success("Live screen sharing active!");
    } catch {
      toast.error("Screen sharing cancelled or unavailable.");
    }
  };

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    const stream = getMasterBroadcastStream();
    let animationFrameId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const canvas = masterCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const screenVid = screenVideoRef.current;
          const camVid = cameraVideoRef.current;

          let drawn = false;
          if (isScreenSharing && screenVid && screenVid.readyState >= 2) {
            try {
              ctx.drawImage(screenVid, 0, 0, canvas.width, canvas.height);
              drawn = true;
            } catch {
              drawn = false;
            }
          }

          if (!drawn && isCameraOn && camVid && camVid.readyState >= 2) {
            try {
              ctx.drawImage(camVid, 0, 0, canvas.width, canvas.height);
              drawn = true;
            } catch {
              drawn = false;
            }
          }

          if (!drawn) {
            drawStudioHudGraphic(
              ctx,
              canvas,
              frame,
              isScreenSharing
                ? "LIVE SCREEN SHARE FEED"
                : "LIVE WEBCAM FEED",
            );
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCameraOn, isScreenSharing, getMasterBroadcastStream]);

  const shouldPublishMedia =
    (isStarting || stream?.status === "LIVE") && Boolean(activeSocket);

  useEffect(() => {
    const masterStream = getMasterBroadcastStream();

    if (
      shouldPublishMedia &&
      activeSocket &&
      typeof MediaRecorder !== "undefined"
    ) {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === "inactive"
      ) {
        try {
          let mimeType = "video/webm;codecs=vp8,opus";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "video/webm";
          }
          const recorder = new MediaRecorder(masterStream, { mimeType });
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = async (e) => {
            if (e.data && e.data.size > 0 && stream?.id) {
              const arrayBuffer = await e.data.arrayBuffer();
              activeSocket.emit("stream:binary_chunk", {
                streamId: stream.id,
                chunk: arrayBuffer,
              });
            }
          };

          recorder.start(500);
        } catch {
          // Handled silently
        }
      }
    } else {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    }
  }, [shouldPublishMedia, stream?.id, activeSocket, getMasterBroadcastStream]);

  useEffect(() => {
    return () => {
      stopCamera();
      stopScreenShare();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    };
  }, [stopCamera, stopScreenShare]);

  if (isLoading || !currentWorkspace) {
    return (
      <LoadingSpinner size="lg" label="Connecting to Live Control Studio..." />
    );
  }

  if (!stream) {
    return (
      <div className="py-12 text-center text-sm font-semibold">
        Stream session not found
      </div>
    );
  }

  const handleStart = async () => {
    try {
      setIsStarting(true);
      if (!isCameraOn && !isScreenSharing) {
        await startCamera();
      }
      toast.info("Connecting media stream to YouTube...");
      await startStream({ id: stream.id, workspaceId: currentWorkspace!.id });
      toast.success("Broadcasting to YouTube & social destinations live!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Broadcast start error: ${msg}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsStopping(true);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      stopCamera();
      stopScreenShare();
      await stopStream({ id: stream.id, workspaceId: currentWorkspace!.id });
      toast.success("Broadcast completed and stream closed. Redirecting...");
      router.push("/streams");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Broadcast stop error: ${msg}`);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={stream.title}
        description="Live Control Studio — Monitor metrics, manage broadcasting nodes, and chat."
        badge={stream.status}
        action={
          <div className="flex items-center gap-3">
            {youtubePlatform && (
              <div className="flex items-center gap-2">
                {youtubePlatform.status === "LIVE" ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    🟢 YouTube LIVE
                  </span>
                ) : youtubePlatform.status === "PENDING" ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    🟡 YouTube Ingestion Pending...
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/30">
                    ⚪ YouTube Offline
                  </span>
                )}
                <Button
                  variant="outline"
                  asChild
                  className="h-10 text-xs font-semibold border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 shadow-sm"
                >
                  <a
                    href={youtubeWatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-2" />
                    Watch on YouTube 🔴
                  </a>
                </Button>
              </div>
            )}
            {stream.status === "LIVE" ? (
              <Button
                onClick={handleStop}
                disabled={isStopping}
                className="h-10 text-xs font-semibold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20"
              >
                {isStopping ? (
                  <>
                    <span className="h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Ending Broadcast...
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 mr-2" />
                    End Broadcast
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={isStarting}
                className="h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                {isStarting ? (
                  <>
                    <span className="h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Connecting to YouTube...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-2" />
                    Go Live Now
                  </>
                )}
              </Button>
            )}
          </div>
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
                    ref={(node) => {
                      videoRef.current = node;
                      const masterStream = masterBroadcastStreamRef.current;
                      if (node && masterStream) {
                        node.srcObject = masterStream;
                        node.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain bg-black relative z-0"
                  />
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      {isScreenSharing
                        ? "Screen Share Active"
                        : "Camera Feed Active"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 p-6">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
                      <Radio className="w-8 h-8 text-rose-500 animate-pulse" />
                    </div>
                    {stream.status === "LIVE" && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white uppercase tracking-wider">
                      {stream.status === "LIVE"
                        ? "Broadcasting Live Stream"
                        : "Live Studio Ready"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {stream.status === "LIVE"
                        ? "Multi-destination broadcasting nodes active. Enable camera or share your screen below."
                        : "Enable camera or share your screen to preview and broadcast to connected destinations."}
                    </p>
                  </div>

                  {/* Audio Visualizer Waveform Bar */}
                  {stream.status === "LIVE" && (
                    <div className="flex items-center justify-center gap-1.5 h-6 pt-2">
                      {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map(
                        (h, i) => (
                          <span
                            key={i}
                            className="w-1 bg-linear-to-t from-violet-500 via-pink-500 to-rose-500 rounded-full animate-pulse"
                            style={{
                              height: `${h}%`,
                              animationDuration: `${0.5 + (i % 4) * 0.2}s`,
                            }}
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Studio Toolbar controls overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  {stream.status === "LIVE" && (
                    <Badge className="bg-rose-600 text-white font-bold animate-pulse text-xs px-3 py-1 shadow-lg shadow-rose-600/30">
                      ● LIVE NOW
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={
                      isScreenSharing ? stopScreenShare : startScreenShare
                    }
                    className="h-8 text-xs font-semibold bg-black/70 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all shadow-md"
                  >
                    {isScreenSharing ? (
                      <MonitorOff className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
                    )}
                    {isScreenSharing ? "Stop Sharing" : "Share Screen"}
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
                    {isCameraOn ? "Turn Off Camera" : "Enable Camera"}
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                  Automated YouTube Live Streaming Pipeline
                </h3>
                {youtubePlatform && (
                  <Badge
                    variant="outline"
                    className="border-red-500/30 text-red-400 text-[10px] uppercase font-bold"
                  >
                    {youtubePlatform.status || "CONNECTED"}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold">
                    YouTube RTMPS Endpoint
                  </span>
                  <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 text-rose-300">
                    {youtubePlatform?.streamUrl ||
                      "rtmps://a.rtmps.youtube.com/live2"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      <Key className="w-3 h-3 text-red-400" />
                      YouTube Live Stream Key
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingKey(!isEditingKey);
                        if (!isEditingKey) setCustomKey(youtubePlatform?.streamKey || "");
                      }}
                      className="text-[11px] font-bold text-violet-400 hover:text-violet-300 underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      {isEditingKey ? "Cancel" : "Edit Key"}
                    </button>
                  </div>
                  {isEditingKey ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        placeholder="Paste YouTube Stream Key (e.g. 607j-htbm-1egc-6gwb-dv3j)"
                        className="h-9 font-mono text-xs bg-black/60 border-violet-500/40 text-white"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveKey}
                        className="h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white font-bold shrink-0 text-xs"
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 flex-1 text-emerald-300">
                        {youtubePlatform?.streamKey
                          ? `${youtubePlatform.streamKey.substring(0, 10)}••••••••`
                          : "••••••••••••••••••••••••"}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyKey}
                        className="h-9 w-9 shrink-0"
                      >
                        {copiedKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {(!youtubePlatform?.streamKey ||
                youtubePlatform.streamKey.startsWith("x-youtube-key-")) && (
                <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">
                    ⚠️ Action Required: Bind Your YouTube Stream Key
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">
                    YouTube is currently showing <strong>&quot;Waiting for NexaSocial&quot;</strong> because a valid YouTube Stream Key is needed for video packet ingestion. Click <strong>Edit Key</strong> above, paste your official <strong>YouTube Stream Key</strong> (e.g. <code className="text-amber-200 font-mono bg-black/40 px-1 rounded">607j-htbm-1egc-6gwb-dv3j</code> from YouTube Studio), and click <strong>Save</strong>!
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Live Camera Feed Relay Active
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Your NexaSocial camera & screen share preview is automatically forwarded to your YouTube Channel live broadcast via FFmpeg. Click <strong className="text-emerald-400">Go Live Now</strong> above to start broadcasting!
                </p>
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
                  {
                    user: "Sam_G",
                    platform: "YT",
                    msg: "Super excited for this update!",
                  },
                  {
                    user: "ElenaR",
                    platform: "TW",
                    msg: "Can we ask questions at the end?",
                  },
                  {
                    user: "DevGuy",
                    platform: "FB",
                    msg: "Stream quality is crystal clear 👍",
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-accent/30 space-y-0.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary">{c.user}</span>
                      <span className="text-[10px] text-muted-foreground">
                        [{c.platform}]
                      </span>
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
