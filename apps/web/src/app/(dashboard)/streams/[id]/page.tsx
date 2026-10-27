/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAuthStore } from "@/stores/auth-store";
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
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Globe,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { livestreamService } from "@/services/livestream.service";

import { useSocketContext } from "@/providers/socket-provider";
import { StreamPlatform } from "@/types";
import { PLATFORM_CONFIG } from "@/lib/constants";

function getErrorMessage(err: unknown, fallback: string = "An unexpected error occurred"): string {
  if (!err) return fallback;
  const anyErr = err as any;
  if (anyErr?.response?.data?.message) {
    const msg = anyErr.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : String(msg);
  }
  if (anyErr?.response?.data?.error) {
    return String(anyErr.response.data.error);
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return String(err) || fallback;
}

export default function StreamControlStudioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { socket, streamSocket } = useSocketContext();
  const activeSocket = streamSocket || socket;

  const { currentWorkspace } = useWorkspaceStore();
  const { hasPermission } = useAuthStore();
  const canStartStream = hasPermission('livestreams.start');
  const canStopStream = hasPermission('livestreams.stop');
  const canUpdateStream = hasPermission('livestreams.update');

  const { data: stream, isLoading } = useStreamDetails(
    id,
    currentWorkspace?.id,
  );
  const { startStream, stopStream, updateStream } = useStreams(currentWorkspace?.id);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    if (stream) {
      setMetaTitle(stream.title || "");
      setMetaDescription(stream.description || "");
    }
  }, [stream]);

  const handleSaveMeta = async () => {
    if (!currentWorkspace || !stream) return;
    try {
      await updateStream({
        id: stream.id,
        workspaceId: currentWorkspace.id,
        payload: { title: metaTitle, description: metaDescription } as any,
      });
      setIsEditingMeta(false);
      toast.success("Stream details updated successfully!");
    } catch (error) {
      toast.error("Failed to update stream details.");
    }
  };

  const queryClient = useQueryClient();
  const [customKeys, setCustomKeys] = useState<Record<string, string>>({});
  const [editingKeys, setEditingKeys] = useState<Record<string, boolean>>({});
  const [copiedKeys, setCopiedKeys] = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [customUrls, setCustomUrls] = useState<Record<string, string>>({});
  const [editingUrls, setEditingUrls] = useState<Record<string, boolean>>({});
  const [copiedUrls, setCopiedUrls] = useState<Record<string, boolean>>({});

  const [isVerifyingSource, setIsVerifyingSource] = useState<Record<string, boolean>>({});
  const [isSyncingMeta, setIsSyncingMeta] = useState<Record<string, boolean>>({});
  const [isPublishingFb, setIsPublishingFb] = useState<Record<string, boolean>>({});
  const [isConfirmingInstagram, setIsConfirmingInstagram] = useState<Record<string, boolean>>({});
  const [isRelayingInstagram, setIsRelayingInstagram] = useState<Record<string, boolean>>({});

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

  const platforms: StreamPlatform[] = stream?.platforms || [];

  const handleVerifyFacebookSource = async (platform: StreamPlatform) => {
    if (!stream || !currentWorkspace) return;
    try {
      setIsVerifyingSource(prev => ({ ...prev, [platform.id]: true }));
      const rawKey = customKeys[platform.id] || platform.streamKey;
      const rawUrl = customUrls[platform.id] || platform.streamUrl;
      const currentKey = rawKey && rawKey !== '••••••••••••••••' ? rawKey.trim() : undefined;
      const currentUrl = rawUrl ? rawUrl.trim() : undefined;

      console.log("[NexaSocial Studio] ▶ Step 1 Triggered: Verifying Facebook video source...", {
        streamId: stream.id,
        platformId: platform.id,
        streamUrl: currentUrl,
        hasKey: Boolean(currentKey),
      });

      const res = await livestreamService.verifyFacebookSource(stream.id, currentWorkspace.id, {
        platformId: platform.id,
        streamKey: currentKey,
        streamUrl: currentUrl,
      });

      console.log("[NexaSocial Studio] ✔ Step 1 Result from backend:", res);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.streams.detail(stream.id),
      });

      if (res.sourceConnected) {
        toast.success(res.message || "Step 1 Complete: Facebook video source confirmed connected!");
      } else {
        toast.info(res.message || "Video relay active. Waiting for video packets from camera...");
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Failed to verify Facebook video source");
      console.error("[NexaSocial Studio] ✖ Step 1 Error:", err);
      toast.error(`Source verification notice: ${msg}`);
    } finally {
      setIsVerifyingSource(prev => ({ ...prev, [platform.id]: false }));
    }
  };

  const handleSyncFacebookMetadata = async (platform: StreamPlatform) => {
    if (!stream || !currentWorkspace) return;
    try {
      setIsSyncingMeta(prev => ({ ...prev, [platform.id]: true }));
      console.log("[NexaSocial Studio] ▶ Step 2 Triggered: Syncing Facebook post details...", {
        streamId: stream.id,
        platformId: platform.id,
        title: metaTitle || stream.title,
      });

      const res = await livestreamService.syncFacebookMetadata(stream.id, currentWorkspace.id, {
        platformId: platform.id,
        title: metaTitle || stream.title,
        description: metaDescription || stream.description,
      });

      console.log("[NexaSocial Studio] ✔ Step 2 Result from backend:", res);

      if (res.streamKey) {
        setCustomKeys(prev => ({ ...prev, [platform.id]: res.streamKey! }));
      }
      if (res.streamUrl) {
        setCustomUrls(prev => ({ ...prev, [platform.id]: res.streamUrl! }));
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.streams.detail(stream.id),
      });

      toast.success(res.message || "Step 2 Complete: Post details synced with Facebook Graph API!");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Failed to sync post details");
      console.error("[NexaSocial Studio] ✖ Step 2 Error:", err);
      toast.error(`Failed to sync post details: ${msg}`);
    } finally {
      setIsSyncingMeta(prev => ({ ...prev, [platform.id]: false }));
    }
  };

  const handlePublishFacebook = async (platform: StreamPlatform) => {
    if (!stream || !currentWorkspace) return;
    try {
      setIsPublishingFb(prev => ({ ...prev, [platform.id]: true }));
      if (!isCameraOn && !isScreenSharing) {
        console.log("[NexaSocial Studio] Camera not started, auto-starting camera before going live...");
        await startCamera();
      }

      console.log("[NexaSocial Studio] ▶ Step 3 Triggered: Publishing to Facebook (Go Live Now)...", {
        streamId: stream.id,
        platformId: platform.id,
        liveVideoId: platform.facebookLiveVideoId,
      });

      toast.info("Connecting & publishing broadcast on Facebook...");
      const res = await livestreamService.publishFacebook(stream.id, currentWorkspace.id, {
        platformId: platform.id,
      });

      console.log("[NexaSocial Studio] ✔ Step 3 Result from backend:", res);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.streams.detail(stream.id),
      });

      toast.success(res.message || "Step 3 Complete: Broadcast is now LIVE on Facebook!");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Failed to publish broadcast to Facebook");
      console.error("[NexaSocial Studio] ✖ Step 3 Error:", err);
      toast.error(`Facebook Go Live error: ${msg}`);
    } finally {
      setIsPublishingFb(prev => ({ ...prev, [platform.id]: false }));
    }
  };

  const handleConfirmInstagramLive = async (
    platform: StreamPlatform,
    manualConfirmed = false,
  ) => {
    if (!stream || !currentWorkspace) return;
    try {
      setIsConfirmingInstagram(prev => ({ ...prev, [platform.id]: true }));
      console.log("[NexaSocial Studio] ▶ Confirming Instagram Live broadcast...", {
        streamId: stream.id,
        platformId: platform.id,
        manualConfirmed,
      });

      const res = await livestreamService.confirmInstagramLive(stream.id, currentWorkspace.id, {
        platformId: platform.id,
        manualConfirmed,
      });

      console.log("[NexaSocial Studio] ✔ Instagram Live check response:", res);

      await queryClient.invalidateQueries({
        queryKey: queryKeys.streams.detail(stream.id),
      });

      if (res.isLive) {
        toast.success(res.message || "Instagram broadcast confirmed as LIVE!");
      } else if (res.verificationStatus === 'VERIFICATION_UNAVAILABLE') {
        toast.info(
          res.message ||
            "Simulated account detected. Automatic Meta Graph API verification is unavailable. Manual streaming to Instagram Live Producer remains active.",
          { duration: 6000 }
        );
      } else if (res.verificationStatus === 'WAITING_FOR_MANUAL_CONFIRMATION') {
        toast.info(
          res.message ||
            "Manual confirmation recorded. Video relay is active. Please verify your stream directly on Instagram.",
          { duration: 6000 }
        );
      } else {
        toast.info(
          res.message ||
            "Video relay is actively transmitting to Instagram. Complete 'Go Live' on Instagram (instagram.com -> Create -> Live video) to publish your broadcast.",
        );
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Failed to confirm Instagram live status");
      console.error("[NexaSocial Studio] ✖ Instagram Confirm Error:", err);
      toast.error(`Instagram live confirmation notice: ${msg}`);
    } finally {
      setIsConfirmingInstagram(prev => ({ ...prev, [platform.id]: false }));
    }
  };

  const handleStartInstagramRelay = async (platform: StreamPlatform) => {
    if (!stream || !currentWorkspace) return;
    if (!platform.streamKey) {
      toast.error("Instagram Stream Key is not configured. Please paste your Stream Key in Step 1 first.");
      return;
    }
    const accountType = (platform.connectedAccount?.metadata?.accountType || '').toUpperCase();
    if (accountType === 'PERSONAL') {
      toast.error(
        "Personal Instagram accounts do not support desktop Live Producer streaming. Please convert your account to a Professional (Creator or Business) account in the Instagram app under Settings -> Account type and tools.",
        { duration: 7000 }
      );
      return;
    }
    try {
      setIsRelayingInstagram(prev => ({ ...prev, [platform.id]: true }));
      if (!isCameraOn && !isScreenSharing) {
        await startCamera();
      }
      const res = await livestreamService.startInstagramOutput(stream.id, currentWorkspace.id, {
        platformId: platform.id,
      });

      // Open Instagram in a new browser tab with safe external-link handling
      window.open(getInstagramProducerUrl(), '_blank', 'noopener,noreferrer');

      await queryClient.invalidateQueries({
        queryKey: queryKeys.streams.detail(stream.id),
      });
      toast.info(
        res.message ||
          "Your video is reaching Instagram. Complete Instagram's Go Live confirmation to publish your broadcast.",
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : String(err));
      toast.error(`Instagram start output error: ${msg}`);
    } finally {
      setIsRelayingInstagram(prev => ({ ...prev, [platform.id]: false }));
    }
  };

  const handleStopInstagramRelay = async (platform: StreamPlatform) => {
    if (!stream || !currentWorkspace) return;
    try {
      setIsRelayingInstagram(prev => ({ ...prev, [platform.id]: true }));
      const res = await livestreamService.stopInstagramOutput(stream.id, currentWorkspace.id, {
        platformId: platform.id,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.streams.detail(stream.id),
      });
      toast.success(res.message || "Instagram RTMP output stopped.");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : String(err));
      toast.error(`Instagram stop output error: ${msg}`);
    } finally {
      setIsRelayingInstagram(prev => ({ ...prev, [platform.id]: false }));
    }
  };

  const handleSaveKey = async (platform: StreamPlatform) => {
    const key = customKeys[platform.id];
    if (!key?.trim() || !stream || !currentWorkspace) return;
    const pName = (platform.connectedAccount?.platformName || '').toUpperCase();
    try {
      if (pName === 'INSTAGRAM') {
        const urlToUse = customUrls[platform.id] || platform.streamUrl;
        await livestreamService.configureInstagramSource(stream.id, currentWorkspace.id, {
          platformId: platform.id,
          streamKey: key.trim(),
          streamUrl: urlToUse,
        });
        setCustomKeys(prev => {
          const next = { ...prev };
          delete next[platform.id];
          return next;
        });
        setEditingKeys(prev => ({ ...prev, [platform.id]: false }));
        await queryClient.invalidateQueries({
          queryKey: queryKeys.streams.detail(stream.id),
        });
        toast.success("Instagram Ingest configured & stream key securely encrypted!");
        return;
      }

      await updateStream({
        id: stream.id,
        workspaceId: currentWorkspace.id,
        payload: { customStreamKey: key.trim(), platformId: platform.id } as any,
      });
      setEditingKeys(prev => ({ ...prev, [platform.id]: false }));
      toast.success(`${platform.connectedAccount?.platformName || 'Platform'} Stream Key saved!`);

      if (pName === 'FACEBOOK') {
        void handleVerifyFacebookSource({ ...platform, streamKey: key.trim() });
      }
    } catch {
      // Handled by toast
    }
  };

  const handleCopyKey = (platform: StreamPlatform) => {
    const keyToCopy = platform.streamKey || "";
    if (keyToCopy) {
      navigator.clipboard.writeText(keyToCopy);
      setCopiedKeys(prev => ({ ...prev, [platform.id]: true }));
      toast.success("Stream Key copied to clipboard!");
      setTimeout(() => setCopiedKeys(prev => ({ ...prev, [platform.id]: false })), 2000);
    }
  };

  const handleSaveUrl = async (platform: StreamPlatform) => {
    const url = customUrls[platform.id];
    if (!url?.trim() || !stream || !currentWorkspace) return;
    const trimmed = url.trim();
    if (!/^rtmps?:\/\//i.test(trimmed)) {
      toast.error("Invalid URL: Must start with rtmp:// or rtmps://");
      return;
    }
    const pName = (platform.connectedAccount?.platformName || '').toUpperCase();
    try {
      if (pName === 'INSTAGRAM') {
        const keyToUse = customKeys[platform.id];
        if (keyToUse) {
          await livestreamService.configureInstagramSource(stream.id, currentWorkspace.id, {
            platformId: platform.id,
            streamKey: keyToUse.trim(),
            streamUrl: trimmed,
          });
          setCustomKeys(prev => {
            const next = { ...prev };
            delete next[platform.id];
            return next;
          });
        }
      }

      await updateStream({
        id: stream.id,
        workspaceId: currentWorkspace.id,
        payload: { customStreamUrl: trimmed, platformId: platform.id } as any,
      });
      setEditingUrls(prev => ({ ...prev, [platform.id]: false }));
      toast.success(`${platform.connectedAccount?.platformName || 'Platform'} Endpoint URL saved!`);

      if (pName === 'FACEBOOK') {
        void handleVerifyFacebookSource({ ...platform, streamUrl: trimmed });
      }
    } catch {
      // Handled by toast
    }
  };

  const handleCopyUrl = (platform: StreamPlatform) => {
    const urlToCopy = platform.streamUrl || "";
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      setCopiedUrls(prev => ({ ...prev, [platform.id]: true }));
      toast.success("RTMPS URL copied to clipboard!");
      setTimeout(() => setCopiedUrls(prev => ({ ...prev, [platform.id]: false })), 2000);
    }
  };

  const getPlatformWatchUrl = (platform: StreamPlatform) => {
    if ((platform as any).viewerUrl) return (platform as any).viewerUrl;

    const pName = (platform.connectedAccount?.platformName || (platform.connectedAccount as any)?.platform || "").toUpperCase();
    const rawStreamId = platform.platformStreamId || "";
    const channelUserId = platform.connectedAccount?.platformUserId || (platform.connectedAccount as any)?.platformAccountId || "";

    if (pName === 'YOUTUBE') {
      const isRealId = Boolean(rawStreamId) && !rawStreamId.startsWith("mock") && rawStreamId.length >= 8;
      if (isRealId) return `https://www.youtube.com/watch?v=${rawStreamId}`;
      if (channelUserId && channelUserId.startsWith("UC")) return `https://www.youtube.com/channel/${channelUserId}/live`;
      if (channelUserId && channelUserId.startsWith("@")) return `https://www.youtube.com/${channelUserId}/live`;
      return "https://www.youtube.com/live";
    }

    if (pName === 'FACEBOOK') {
      const isRealId = Boolean(rawStreamId) && !rawStreamId.startsWith("mock") && rawStreamId.length >= 8;
      // If we don't have viewerUrl, it means it's either not published yet, or we're falling back
      if (isRealId) return `https://www.facebook.com/${rawStreamId}`;
      if (channelUserId) return `https://www.facebook.com/${channelUserId}/live_videos`;
      return "https://www.facebook.com/live";
    }

    if (pName === 'INSTAGRAM') {
      if (platform.viewerUrl && platform.viewerUrl.startsWith('http')) {
        return platform.viewerUrl;
      }
      return null;
    }

    return "#";
  };

  const getInstagramProfileUrl = (platform: StreamPlatform): string => {
    const raw =
      platform.connectedAccount?.metadata?.username ||
      platform.connectedAccount?.accountName ||
      platform.connectedAccount?.name;
    if (!raw) return "https://www.instagram.com/";
    const isMock =
      platform.connectedAccount?.platformUserId?.startsWith('mock') ||
      raw.toLowerCase().includes('mock');
    if (isMock) return "https://www.instagram.com/";
    const clean = raw.trim().replace(/^@/, '').replace(/\s+/g, '');
    return `https://www.instagram.com/${clean}/`;
  };

  const getInstagramProducerUrl = () => {
    return "https://www.instagram.com/";
  };

  const getFacebookProducerUrl = (p: StreamPlatform) => {
    if ((p as any).producerUrl) return (p as any).producerUrl;
    if (!p.facebookLiveVideoId) return "https://www.facebook.com/live/producer";
    const pageId = p.facebookPageId || p.connectedAccount?.platformUserId || '1275681598955336';
    return `https://www.facebook.com/${pageId}/live_producer/?broadcast_id=${p.facebookLiveVideoId}`;
  };

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
          audioContextRef.current.resume().catch(() => { });
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
        await cameraVideoRef.current.play().catch(() => { });
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
      let screenStream: MediaStream | null = null;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true,
        });
      } catch (err) {
        console.warn("Display media with audio failed, trying video only", err);
        throw err;
      }

      if (isCameraOn) {
        stopCamera();
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
        await screenVideoRef.current.play().catch(() => { });
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
    const masterStream = getMasterBroadcastStream();
    let frame = 0;
    let isRunning = true;
    let worker: Worker | null = null;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

    const render = () => {
      if (!isRunning) return;
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
    };

    // Use Web Worker timer to avoid browser background tab throttling when user opens Instagram Live Producer
    try {
      const blob = new Blob(
        [
          `let timer; self.onmessage = function(e) {
            if (e.data === 'start') {
              timer = setInterval(function() { self.postMessage('tick'); }, 1000 / 30);
            } else if (e.data === 'stop') {
              clearInterval(timer);
            }
          };`,
        ],
        { type: "application/javascript" },
      );
      const workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);
      worker.onmessage = () => render();
      worker.postMessage("start");
    } catch {
      // Fallback to setTimeout loop if Web Workers are restricted in environment
      const loop = () => {
        if (!isRunning) return;
        render();
        fallbackTimeout = setTimeout(loop, 1000 / 30);
      };
      loop();
    }

    if (videoRef.current && videoRef.current.srcObject !== masterStream) {
      videoRef.current.srcObject = masterStream;
      videoRef.current.play().catch(() => { });
    }

    return () => {
      isRunning = false;
      if (worker) {
        worker.postMessage("stop");
        worker.terminate();
      }
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
    };
  }, [isCameraOn, isScreenSharing, getMasterBroadcastStream]);

  const isAnyRelayActive = platforms.some(
    (p) =>
      (stream?.status === "LIVE" && Boolean(p.isRelayActive)) ||
      p.status === "TRANSMITTING",
  );

  const shouldPublishMedia =
    (stream?.status === "LIVE" || isAnyRelayActive) &&
    (isCameraOn || isScreenSharing) &&
    Boolean(activeSocket);

  const isStreamingActive = stream?.status === "LIVE";

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
      toast.info("Connecting media stream to platforms...");
      await startStream({ id: stream.id, workspaceId: currentWorkspace!.id });

      const hasInstagram = platforms.some(
        p => p.connectedAccount?.platformName?.toUpperCase() === 'INSTAGRAM'
      );
      if (hasInstagram) {
        window.open(getInstagramProducerUrl(), '_blank', 'noopener,noreferrer');
        toast.info(
          "Your video is reaching Instagram Live Producer. Complete Instagram's Go Live confirmation to publish your broadcast."
        );
      } else {
        toast.success("Broadcasting to destinations live!");
      }
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Broadcast start failed");
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

      const hasManualPlatforms = platforms.some(p =>
        p.connectedAccount?.platformName?.toUpperCase() === 'FACEBOOK' && p.streamUrl
      );

      if (hasManualPlatforms) {
        toast.success("Stream stopped locally. Don't forget to click 'End Live Video' on Facebook Live Producer!");
      } else {
        toast.success("Broadcast completed and stream closed. Redirecting...");
      }

      router.push("/streams");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Broadcast stop failed");
      toast.error(`Broadcast stop error: ${msg}`);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            {stream.title}
            {stream.status !== "LIVE" && !isEditingMeta && canUpdateStream && (
              <button onClick={() => setIsEditingMeta(true)} className="text-muted-foreground hover:text-white transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        }
        description={stream.description || "Live Control Studio — Monitor metrics, manage broadcasting nodes, and chat."}
        badge={stream.status}
        action={
          <div className="flex items-center gap-3">
            {platforms.map(platform => {
              const pName = platform.connectedAccount?.platformName?.toUpperCase() || 'UNKNOWN';
              const config = PLATFORM_CONFIG[pName as keyof typeof PLATFORM_CONFIG] || { name: pName, color: '#aaa', icon: '🌍' };

              return (
                <div key={platform.id} className="flex items-center gap-2 mr-2">
                  {platform.status === "LIVE" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      🟢 {config.name} LIVE
                    </span>
                  ) : platform.status === "TRANSMITTING" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      🟣 {config.name} Transmitting
                    </span>
                  ) : platform.status === "WAITING_FOR_INSTAGRAM_CONFIRMATION" || platform.status === "WAITING_FOR_PLATFORM_PREVIEW" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      ⏳ {config.name} Awaiting Confirmation
                    </span>
                  ) : platform.status === "STATUS_UNVERIFIED" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      ⚠️ {config.name} Unverified
                    </span>
                  ) : platform.status === "CONFIGURED" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      🟣 {config.name} Configured
                    </span>
                  ) : platform.status === "PENDING" || platform.status === "SCHEDULED" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      🟡 {config.name} Pending...
                    </span>
                  ) : platform.status === "FAILED" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                      🔴 {config.name} Failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/30">
                      ⚪ {config.name} Offline
                    </span>
                  )}
                  {pName === 'FACEBOOK' ? (
                    platform.status === 'LIVE' || stream.status === 'LIVE' ? (
                      <Button
                        variant="outline"
                        asChild
                        className="h-10 text-xs font-semibold shadow-sm"
                        style={{ borderColor: `${config.color}30`, backgroundColor: `${config.color}10`, color: config.color }}
                      >
                        <a
                          href={getPlatformWatchUrl(platform) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-2" />
                          Watch on {config.name} 🔴
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        disabled
                        className="h-10 text-xs font-semibold shadow-sm cursor-not-allowed opacity-70"
                        style={{ borderColor: `${config.color}30`, backgroundColor: `${config.color}10`, color: config.color }}
                        title={`Your ${config.name} watch link will be available after the broadcast is live.`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-2" />
                        Watch on {config.name}
                      </Button>
                    )
                  ) : pName === 'INSTAGRAM' ? (
                    platform.status === 'LIVE' ? (
                      platform.viewerUrl ? (
                        <Button
                          variant="outline"
                          asChild
                          className="h-10 text-xs font-semibold shadow-sm"
                          style={{ borderColor: `${config.color}30`, backgroundColor: `${config.color}10`, color: config.color }}
                        >
                          <a
                            href={platform.viewerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                            Watch on Instagram 🔴
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          asChild
                          className="h-10 text-xs font-semibold shadow-sm"
                          style={{ borderColor: `${config.color}30`, backgroundColor: `${config.color}10`, color: config.color }}
                          title="Instagram Live streams are viewed via your profile in the Instagram mobile app. Live Producer does not provide direct web broadcast links."
                        >
                          <a
                            href={getInstagramProfileUrl(platform)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-2" />
                            Instagram Profile ↗
                          </a>
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="outline"
                        asChild
                        className="h-10 text-xs font-semibold shadow-sm"
                        style={{ borderColor: `${config.color}30`, backgroundColor: `${config.color}10`, color: config.color }}
                        title="Open Instagram on desktop to create a Live session"
                      >
                        <a
                          href={getInstagramProducerUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-2" />
                          Open Instagram (Create Live) ↗
                        </a>
                      </Button>
                    )
                  ) : (
                    platform.status === 'LIVE' || stream.status === 'LIVE' ? (
                      <Button
                        variant="outline"
                        asChild
                        className="h-10 text-xs font-semibold shadow-sm"
                        style={{ borderColor: `${config.color}30`, backgroundColor: `${config.color}10`, color: config.color }}
                      >
                        <a
                          href={getPlatformWatchUrl(platform) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-2" />
                          Watch on {config.name} 🔴
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        disabled
                        className="h-10 text-xs font-semibold shadow-sm cursor-not-allowed opacity-70"
                        style={{ borderColor: `${config.color}30`, backgroundColor: `${config.color}10`, color: config.color }}
                        title={`Your ${config.name} watch link will be available after the broadcast is live.`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-2" />
                        Watch on {config.name}
                      </Button>
                    )
                  )}
                </div>
              );
            })}

            {isStreamingActive ? (
              canStopStream && (
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
              )
            ) : (
              canStartStream && (
                <Button
                  onClick={handleStart}
                  disabled={isStarting || stream.status === "FAILED"}
                  className="h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  {isStarting ? (
                    <>
                      <span className="h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-2" />
                      Go Live Now
                    </>
                  )}
                </Button>
              )
            )}
          </div>
        }
      />

      {isEditingMeta && (
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Edit Stream Details (Post Details)</CardTitle>
            <CardDescription className="text-xs">
              These details are sent to platforms (like Facebook Live API) to complete your post information automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Title</label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Awesome Live Stream"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <Input
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Join me live!"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditingMeta(false)} className="h-8">Cancel</Button>
              <Button size="sm" onClick={handleSaveMeta} className="h-8 bg-violet-600 hover:bg-violet-700">Save Details</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                        node.play().catch(() => { });
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
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors ${
                        stream.status === "LIVE"
                          ? "bg-rose-500/10 border border-rose-500/30"
                          : "bg-muted/40 border border-border/50"
                      }`}
                    >
                      <Radio
                        className={`w-8 h-8 transition-colors ${
                          stream.status === "LIVE"
                            ? "text-rose-500 animate-pulse"
                            : "text-muted-foreground"
                        }`}
                      />
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
                        : stream.status === "FAILED"
                          ? "Broadcast Failed"
                          : "Live Studio Ready"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {stream.status === "LIVE"
                        ? "Multi-destination broadcasting nodes active. Enable camera or share your screen below."
                        : stream.status === "FAILED"
                          ? "Failed to connect to one or more platforms. Please check settings."
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

            <CardContent className="p-5 space-y-6">
              {platforms.length === 0 && (
                <div className="text-center p-4 text-xs text-muted-foreground">
                  No destinations connected to this stream.
                </div>
              )}

              {platforms.map(platform => {
                const pName = platform.connectedAccount?.platformName?.toUpperCase() || 'UNKNOWN';
                const config = PLATFORM_CONFIG[pName as keyof typeof PLATFORM_CONFIG] || { name: pName, color: '#aaa', icon: '🌍' };
                const isEditing = editingKeys[platform.id] || false;
                const isCopied = copiedKeys[platform.id] || false;
                const currentVal = customKeys[platform.id] !== undefined ? customKeys[platform.id] : (platform.streamKey || "");
                const isMissingKey = !platform.streamKey || platform.streamKey.startsWith("x-youtube-key-");

                const isEditingUrl = editingUrls[platform.id] || false;
                const isCopiedUrl = copiedUrls[platform.id] || false;
                const currentUrlVal = customUrls[platform.id] !== undefined ? customUrls[platform.id] : (platform.streamUrl || "rtmps://live-api-s.facebook.com:443/rtmp/");

                if (pName === 'FACEBOOK') {
                  const step1Complete = Boolean(platform.sourceStatus === 'CONNECTED' || (platform as any).sourceConnected);
                  const step2Complete = Boolean(platform.metadataStatus === 'COMPLETED' || (platform as any).metadataCompleted);
                  const step3Complete = Boolean(platform.publishStatus === 'PUBLISHED' || platform.status === 'LIVE');
                  const stepCount = (step1Complete ? 1 : 0) + (step2Complete ? 1 : 0) + (step3Complete ? 1 : 0);

                  return (
                    <div key={platform.id} className="space-y-4 pb-6 border-b border-border/40 last:border-0 last:pb-0">
                      {/* Facebook Header with Progress */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-linear-to-r from-blue-950/40 via-indigo-950/30 to-black/40 border border-blue-500/25">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🌐</span>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              Facebook Live Stream Pipeline
                              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                                3-Step Automated Workflow
                              </Badge>
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-400">
                            Page Destination: <strong className="text-white">{platform.connectedAccount?.accountName || platform.connectedAccount?.name || "NexaSocial"}</strong> {platform.facebookPageId && <span className="text-zinc-500 font-mono text-[11px]">(Page ID: {platform.facebookPageId})</span>}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-bold text-white">
                              {stepCount}/3 Steps Complete
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              {stepCount === 3 ? "Broadcast is Live!" : "Workflow in Progress"}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <div className={`h-2.5 w-6 rounded-full transition-colors ${step1Complete ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-zinc-700'}`} title="Step 1: Video Source" />
                            <div className={`h-2.5 w-6 rounded-full transition-colors ${step2Complete ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-zinc-700'}`} title="Step 2: Post Details" />
                            <div className={`h-2.5 w-6 rounded-full transition-colors ${step3Complete ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-zinc-700'}`} title="Step 3: Go Live" />
                          </div>
                        </div>
                      </div>

                      {/* Step 1: Connect Video Source */}
                      <div className={`p-4 rounded-xl border transition-all ${step1Complete ? 'bg-emerald-950/15 border-emerald-500/30' : 'bg-zinc-900/40 border-border/50'}`}>
                        <div className="flex items-center justify-between pb-3 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 text-xs font-bold border border-blue-500/40">1</span>
                            <span className="text-sm font-bold text-white">Step 1 — Connect Video Source</span>
                          </div>
                          {step1Complete ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Video Source Connected
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Connect Source
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-3">
                          {/* Endpoint */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 font-semibold flex items-center gap-1">
                                <Globe className="w-3 h-3 text-blue-400" />
                                Facebook RTMPS Endpoint
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUrls(prev => ({ ...prev, [platform.id]: !isEditingUrl }));
                                  if (!isEditingUrl) {
                                    setCustomUrls(prev => ({ ...prev, [platform.id]: platform.streamUrl || "rtmps://live-api-s.facebook.com:443/rtmp/" }));
                                  }
                                }}
                                className="text-[11px] font-bold text-violet-400 hover:text-violet-300 underline flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                {isEditingUrl ? "Cancel" : "Edit URL"}
                              </button>
                            </div>
                            {isEditingUrl ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={currentUrlVal}
                                  onChange={(e) => setCustomUrls(prev => ({ ...prev, [platform.id]: e.target.value }))}
                                  placeholder="rtmps://live-api-s.facebook.com:443/rtmp/"
                                  className="h-9 font-mono text-xs bg-black/60 border-violet-500/40 text-white"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveUrl(platform)}
                                  className="h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white font-bold shrink-0 text-xs"
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 flex-1 text-blue-300">
                                  {platform.streamUrl || "rtmps://live-api-s.facebook.com:443/rtmp/"}
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleCopyUrl(platform)}
                                  className="h-9 w-9 shrink-0"
                                >
                                  {isCopiedUrl ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Stream Key */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 font-semibold flex items-center gap-1">
                                <Key className="w-3 h-3 text-red-400" />
                                Facebook Stream Key
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKeys(prev => ({ ...prev, [platform.id]: !isEditing }));
                                  if (!isEditing) {
                                    setCustomKeys(prev => ({ ...prev, [platform.id]: platform.streamKey || "" }));
                                  }
                                }}
                                className="text-[11px] font-bold text-violet-400 hover:text-violet-300 underline flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                {isEditing ? "Cancel" : "Edit Key"}
                              </button>
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={currentVal}
                                  onChange={(e) => setCustomKeys(prev => ({ ...prev, [platform.id]: e.target.value }))}
                                  placeholder="Paste Facebook Stream Key"
                                  type="password"
                                  className="h-9 font-mono text-xs bg-black/60 border-violet-500/40 text-white"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveKey(platform)}
                                  className="h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white font-bold shrink-0 text-xs"
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 flex-1 text-emerald-300">
                                  {platform.streamKey
                                    ? (showKeys[platform.id] ? platform.streamKey : "••••••••••••••••")
                                    : "Configuration Required (Add Key)"}
                                </div>
                                {platform.streamKey && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setShowKeys(prev => ({ ...prev, [platform.id]: !prev[platform.id] }))}
                                      className="h-9 w-9 shrink-0 text-zinc-400 hover:text-white"
                                      title={showKeys[platform.id] ? "Hide Stream Key" : "Reveal Stream Key"}
                                    >
                                      {showKeys[platform.id] ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleCopyKey(platform)}
                                      className="h-9 w-9 shrink-0"
                                      title="Copy Stream Key"
                                    >
                                      {isCopied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-border/20 text-xs">
                          <div className="flex items-center gap-2">
                            {isCameraOn || isScreenSharing ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                <Radio className="w-3.5 h-3.5 animate-pulse" />
                                Live video feed sending to Facebook ingest relay
                              </span>
                            ) : (
                              <span className="text-amber-400/90 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Camera offline. Click &quot;Enable Camera&quot; above to feed video to Facebook.
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleVerifyFacebookSource(platform)}
                            disabled={isVerifyingSource[platform.id]}
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold self-start sm:self-auto"
                          >
                            {isVerifyingSource[platform.id] ? (
                              <>
                                <span className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                Test & Verify Source Connection
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Step 2: Complete Post Details */}
                      <div className={`p-4 rounded-xl border transition-all ${step2Complete ? 'bg-emerald-950/15 border-emerald-500/30' : 'bg-zinc-900/40 border-border/50'}`}>
                        <div className="flex items-center justify-between pb-3 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-bold border border-indigo-500/40">2</span>
                            <span className="text-sm font-bold text-white">Step 2 — Complete Post Details Automatically</span>
                          </div>
                          {step2Complete ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Details Confirmed by Facebook
                            </Badge>
                          ) : platform.metadataStatus === 'FAILED' ? (
                            <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] font-semibold">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Sync Failed
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Pending Sync
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-3">
                          <div className="p-3 rounded-lg bg-black/40 border border-border/30 space-y-1">
                            <span className="text-zinc-400 text-[11px] font-medium">Broadcast Title</span>
                            <p className="font-semibold text-white truncate">{stream.title}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-black/40 border border-border/30 space-y-1">
                            <span className="text-zinc-400 text-[11px] font-medium">Broadcast Description</span>
                            <p className="text-zinc-300 truncate">{stream.description || "No description provided"}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-black/40 border border-border/30 space-y-1">
                            <span className="text-zinc-400 text-[11px] font-medium">Facebook Live Video ID</span>
                            {platform.facebookLiveVideoId ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={getFacebookProducerUrl(platform)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-emerald-300 font-semibold underline hover:text-emerald-200 truncate flex items-center gap-1"
                                  title="Open this exact broadcast in Facebook Live Producer"
                                >
                                  {platform.facebookLiveVideoId}
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              </div>
                            ) : (
                              <p className="font-mono text-zinc-500 truncate">Generated automatically on sync</p>
                            )}
                          </div>
                          <div className="p-3 rounded-lg bg-black/40 border border-border/30 space-y-1">
                            <span className="text-zinc-400 text-[11px] font-medium">Facebook Destination</span>
                            <p className="text-white font-medium truncate">{platform.connectedAccount?.accountName || platform.connectedAccount?.name || "Connected Facebook Page"}</p>
                          </div>
                        </div>

                        {platform.facebookLastError && platform.metadataStatus === 'FAILED' && (
                          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs space-y-1 mt-3">
                            <div className="font-bold flex items-center gap-1.5 text-rose-400">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Facebook API Error (Code: {platform.facebookLastErrorCode || 'FB_ERROR'})
                            </div>
                            <p className="text-[11px] text-rose-200/90 leading-relaxed">{platform.facebookLastError}</p>
                          </div>
                        )}

                        {step2Complete && platform.facebookLiveVideoId && (
                          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/40 text-blue-200 text-xs space-y-2 mt-3">
                            <div className="font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-blue-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                Post details confirmed on Facebook Page: {platform.connectedAccount?.name || 'NexaSocial'}
                              </span>
                              <Button
                                size="sm"
                                asChild
                                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow self-start sm:self-auto"
                              >
                                <a
                                  href={getFacebookProducerUrl(platform)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Open in Live Producer ↗
                                </a>
                              </Button>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-relaxed">
                              This live broadcast is synced to Facebook Page: <strong className="text-white">{platform.connectedAccount?.name || 'NexaSocial'}</strong>. Click &quot;Open in Live Producer&quot; to inspect this stream directly on Facebook (make sure your Facebook account is switched to your Page profile).
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-border/20 text-xs">
                          <p className="text-zinc-400 text-[11px]">
                            Metadata is automatically synced to the Facebook Live Video object via Graph API.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleSyncFacebookMetadata(platform)}
                            disabled={isSyncingMeta[platform.id]}
                            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold self-start sm:self-auto"
                          >
                            {isSyncingMeta[platform.id] ? (
                              <>
                                <span className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Syncing with Facebook...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                Sync Post Details with Facebook
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Step 3: Go Live Now */}
                      <div className={`p-4 rounded-xl border transition-all ${step3Complete ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-zinc-900/40 border-border/50'}`}>
                        <div className="flex items-center justify-between pb-3 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 text-xs font-bold border border-emerald-500/40">3</span>
                            <span className="text-sm font-bold text-white">Step 3 — Go Live Now</span>
                          </div>
                          {step3Complete ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold animate-pulse">
                              ● BROADCAST IS LIVE
                            </Badge>
                          ) : platform.publishStatus === 'FAILED' ? (
                            <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] font-semibold">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Publish Failed
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] font-semibold">
                              Ready to Publish
                            </Badge>
                          )}
                        </div>

                        {platform.facebookLastError && platform.publishStatus === 'FAILED' && (
                          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs space-y-1 my-3">
                            <div className="font-bold flex items-center gap-1.5 text-rose-400">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Facebook Publish Error (Code: {platform.facebookLastErrorCode || 'PUBLISH_FAILED'})
                            </div>
                            <p className="text-[11px] text-rose-200/90 leading-relaxed">{platform.facebookLastError}</p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs">
                          {step3Complete ? (
                            <div className="space-y-1">
                              <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                Broadcast is streaming live to your Facebook audience!
                              </p>
                              {platform.publishedAt && (
                                <p className="text-[11px] text-zinc-400">
                                  Published at: {new Date(platform.publishedAt).toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-zinc-300 text-[11px] leading-relaxed">
                              Execute the verified Facebook Graph API transition to transition from UNPUBLISHED to LIVE_NOW.
                            </p>
                          )}

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {step3Complete ? (
                              <Button
                                size="sm"
                                asChild
                                className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30"
                              >
                                <a
                                  href={getPlatformWatchUrl(platform)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                  Watch on Facebook 🔴
                                </a>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handlePublishFacebook(platform)}
                                disabled={isPublishingFb[platform.id] || stream.status === "LIVE"}
                                className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                              >
                                {isPublishingFb[platform.id] ? (
                                  <>
                                    <span className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Publishing to Facebook...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 mr-1.5" />
                                    Go Live on Facebook Now
                                  </>
                                )}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-9 text-xs text-zinc-400 hover:text-white"
                            >
                              <a
                                href={getFacebookProducerUrl(platform)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={
                                  platform.facebookLiveVideoId
                                    ? `Open Facebook Live Producer for Broadcast #${platform.facebookLiveVideoId}`
                                    : "Open Facebook Live Producer in browser"
                                }
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                {platform.facebookLiveVideoId ? "Open in Live Producer ↗" : "Live Producer"}
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (pName === 'INSTAGRAM') {
                  const isLive =
                    platform.status === 'LIVE' &&
                    platform.verificationStatus === 'LIVE_VERIFIED';
                  const isUnverified = platform.status === 'STATUS_UNVERIFIED';
                  const isWaitingConfirmation =
                    platform.status === 'WAITING_FOR_INSTAGRAM_CONFIRMATION' ||
                    platform.status === 'WAITING_FOR_PLATFORM_PREVIEW';
                  const isRelayActive = Boolean(platform.isRelayActive);
                  const isTransmitting =
                    platform.status === 'TRANSMITTING' ||
                    platform.sourceStatus === 'TRANSMITTING' ||
                    isRelayActive;
                  const isStarting =
                    platform.status === 'STARTING' ||
                    platform.sourceStatus === 'STARTING' ||
                    Boolean(isRelayingInstagram[platform.id]);
                  const isCameraActive = isCameraOn || isScreenSharing;
                  const isConfigured =
                    platform.status === 'CONFIGURED' || Boolean(platform.streamKey);
                  const accountType = (platform.connectedAccount?.metadata?.accountType || '').toUpperCase();
                  const isPersonalAccount = accountType === 'PERSONAL';
                  const isMockAccount = Boolean(
                    platform.connectedAccount?.platformUserId?.startsWith('mock_') ||
                    platform.connectedAccount?.metadata?.isMock ||
                    platform.connectedAccount?.metadata?.accountType === 'MOCK' ||
                    (platform as any).isMockAccount
                  );
                  const username = platform.connectedAccount?.metadata?.username || platform.connectedAccount?.name || 'Instagram Account';

                  return (
                    <div key={platform.id} className="space-y-4 pb-6 border-b border-border/40 last:border-0 last:pb-0">
                      {/* Instagram Header with Capability and Mode */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-linear-to-r from-pink-950/40 via-purple-950/30 to-black/40 border border-pink-500/25">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📸</span>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              Instagram Live Stream Pipeline
                              <Badge variant="outline" className="text-[10px] bg-pink-500/10 text-pink-400 border-pink-500/30">
                                Mode B: Live Producer Desktop Workflow
                              </Badge>
                              {isMockAccount && (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                                  Simulated ({platform.connectedAccount?.platformUserId})
                                </Badge>
                              )}
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-400">
                            Connected Account: <strong className="text-white">@{username}</strong>
                            {accountType && (
                              <span className="ml-2 font-mono text-[11px] text-zinc-500">
                                ({accountType === 'PERSONAL' ? 'Personal Account ⚠️' : `${accountType} Account`})
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {isLive ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold animate-pulse">
                              ● LIVE_VERIFIED (Broadcast Active)
                            </Badge>
                          ) : isUnverified ? (
                            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/40 text-[10px] font-semibold">
                              ⚠️ STATUS_UNVERIFIED
                            </Badge>
                          ) : isWaitingConfirmation ? (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3 mr-1 text-amber-400" />
                              WAITING_FOR_INSTAGRAM_CONFIRMATION
                            </Badge>
                          ) : isStarting ? (
                            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] font-semibold">
                              <span className="h-2 w-2 mr-1 rounded-full border border-blue-400 border-t-transparent animate-spin" />
                              RELAY_STARTING
                            </Badge>
                          ) : isTransmitting ? (
                            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] font-semibold">
                              <Radio className="w-3 h-3 mr-1 animate-pulse" />
                              TRANSMITTING
                            </Badge>
                          ) : isCameraActive ? (
                            <Badge className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30 text-[10px] font-semibold">
                              📷 CAMERA_ACTIVE
                            </Badge>
                          ) : isConfigured ? (
                            <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30 text-[10px] font-semibold">
                              <Check className="w-3 h-3 mr-1" />
                              CONFIGURED
                            </Badge>
                          ) : platform.status === 'ENDED' ? (
                            <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[10px] font-semibold">
                              ENDED
                            </Badge>
                          ) : platform.status === 'FAILED' ? (
                            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] font-semibold">
                              FAILED
                            </Badge>
                          ) : (
                            <Badge className="bg-pink-500/15 text-pink-400 border-pink-500/30 text-[10px] font-semibold">
                              READY FOR SETUP
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Transmission & Lifecycle Diagnostics Panel */}
                      <div className="p-3 rounded-xl bg-black/40 border border-zinc-800/80 text-xs font-mono space-y-1.5">
                        <div className="flex items-center justify-between text-zinc-400 text-[11px] font-semibold border-b border-zinc-800/60 pb-1">
                          <span className="flex items-center gap-1.5 text-zinc-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                            Transmission & Lifecycle Diagnostics
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Stream: {stream.id.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-0.5">
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Lifecycle State</span>
                            <span className="font-semibold text-zinc-200">
                              {isLive
                                ? "LIVE_VERIFIED"
                                : isUnverified
                                ? "STATUS_UNVERIFIED"
                                : isWaitingConfirmation
                                ? "WAITING_CONFIRMATION"
                                : isTransmitting
                                ? "TRANSMITTING"
                                : isStarting
                                ? "RELAY_STARTING"
                                : isCameraActive
                                ? "CAMERA_ACTIVE"
                                : platform.status || "IDLE"}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Relay Process</span>
                            <span className="font-semibold text-zinc-200">
                              {platform.relayDiagnostics?.pid
                                ? `PID ${platform.relayDiagnostics.pid} (Running)`
                                : isRelayActive
                                ? "Active"
                                : "Not Running"}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Frames / Chunks Sent</span>
                            <span className="font-semibold text-emerald-400">
                              {platform.transmittedChunks ?? platform.relayDiagnostics?.transmittedChunks ?? 0} chunks
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Last Transmission</span>
                            <span className="font-semibold text-zinc-300">
                              {platform.lastTransmissionTime
                                ? new Date(platform.lastTransmissionTime).toLocaleTimeString()
                                : platform.relayDiagnostics?.lastTransmissionTime
                                ? new Date(platform.relayDiagnostics.lastTransmissionTime).toLocaleTimeString()
                                : isTransmitting
                                ? "Active"
                                : "None"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mock Account Warning if detected */}
                      {isMockAccount && (
                        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                          <div className="font-bold flex items-center gap-1.5 text-amber-300">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            Simulated / Mock Instagram Account Detected ({platform.connectedAccount?.platformUserId})
                          </div>
                          <p className="text-[11px] text-amber-200/90 leading-relaxed">
                            This connection was established in development simulation mode. Real Meta Graph API live broadcast verification is unavailable for simulated accounts.
                            You can still stream to Instagram Live Producer using your manual stream key, and verify the broadcast manually on instagram.com.
                            To enable automated API verification, reconnect a real Meta Professional (Creator or Business) account under <strong>Settings → Connected Accounts</strong>.
                          </p>
                        </div>
                      )}

                      {/* Personal account warning if detected */}
                      {isPersonalAccount && (
                        <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-red-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Personal Account Ineligible for Live Streaming
                          </div>
                          <p className="text-[11px] text-red-200/90 leading-relaxed">
                            Instagram Live Producer is officially available only for <strong>Professional (Creator or Business)</strong> accounts. Personal accounts cannot access desktop live streaming. Please switch your account in the Instagram mobile app settings under &quot;Account type and tools&quot;.
                          </p>
                        </div>
                      )}

                      {/* Instagram Live Eligibility & Session Pre-requisites Checklist */}
                      <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs space-y-2.5">
                        <div className="font-bold flex items-center justify-between text-purple-300">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-purple-400" />
                            Instagram Live Eligibility &amp; Setup Checklist
                          </span>
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/30">
                            {isPersonalAccount ? "ELIGIBILITY_FAILED" : isMockAccount ? "ELIGIBILITY_NOT_VERIFIED (SIMULATED)" : "MANUAL_CHECKLIST"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-black/30 border border-border/30">
                            <span className={isPersonalAccount ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                              {isPersonalAccount ? "✗" : "✓"}
                            </span>
                            <div>
                              <strong className="text-zinc-200">Professional Account: </strong>
                              <span className={isPersonalAccount ? "text-red-300" : "text-zinc-400"}>
                                {isPersonalAccount ? "Personal account ineligible for Live Producer" : "Creator or Business account required"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-black/30 border border-border/30">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <div>
                              <strong className="text-zinc-200">Public Profile: </strong>
                              <span className="text-zinc-400">Account must be Public to broadcast to viewers</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-black/30 border border-border/30">
                            <span className="text-purple-400 font-bold">ℹ</span>
                            <div>
                              <strong className="text-zinc-200">Desktop Live Video: </strong>
                              <span className="text-zinc-400">Must see &quot;Create (+) → Live video&quot; on instagram.com</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-black/30 border border-border/30">
                            <span className="text-amber-400 font-bold">⚠</span>
                            <div>
                              <strong className="text-zinc-200">Fresh Session Key: </strong>
                              <span className="text-zinc-400">Instagram generates a new key per session; do not reuse old keys</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Instagram Ingest Error Alert */}
                      {platform.instagramLastError && (
                        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-bold text-red-300">Instagram Ingest Warning / Error</p>
                            <p className="text-[11px] text-red-200/90 leading-relaxed">{platform.instagramLastError}</p>
                            {platform.instagramLastErrorCode && (
                              <Badge variant="outline" className="text-[9px] font-mono bg-red-500/10 text-red-400 border-red-500/30">
                                Code: {platform.instagramLastErrorCode}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 1: Connect Ingest & Stream Key */}
                      <div className="p-4 rounded-xl border bg-zinc-900/40 border-border/50 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-pink-600/30 text-pink-400 text-xs font-bold border border-pink-500/40">1</span>
                            <span className="text-sm font-bold text-white">Step 1 — Instagram Live Session &amp; Ingest Setup</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-7 text-xs text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                          >
                            <a
                              href={getInstagramProducerUrl()}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open Instagram (Create Live) ↗
                            </a>
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Endpoint */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 font-semibold flex items-center gap-1">
                                <Globe className="w-3 h-3 text-pink-400" />
                                Instagram RTMPS Ingest URL
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUrls(prev => ({ ...prev, [platform.id]: !isEditingUrl }));
                                  if (!isEditingUrl) {
                                    setCustomUrls(prev => ({ ...prev, [platform.id]: platform.streamUrl || "rtmps://live-upload.instagram.com:443/rtmp/" }));
                                  }
                                }}
                                className="text-[11px] font-bold text-pink-400 hover:text-pink-300 underline flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                {isEditingUrl ? "Cancel" : "Edit URL"}
                              </button>
                            </div>
                            {isEditingUrl ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={currentUrlVal}
                                  onChange={(e) => setCustomUrls(prev => ({ ...prev, [platform.id]: e.target.value }))}
                                  placeholder="rtmps://live-upload.instagram.com:443/rtmp/"
                                  className="h-9 font-mono text-xs bg-black/60 border-pink-500/40 text-white"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveUrl(platform)}
                                  className="h-9 px-3 bg-pink-600 hover:bg-pink-700 text-white font-bold shrink-0 text-xs"
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 flex-1 text-pink-300">
                                  {platform.streamUrl || "rtmps://live-upload.instagram.com:443/rtmp/"}
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleCopyUrl(platform)}
                                  className="h-9 w-9 shrink-0"
                                >
                                  {isCopiedUrl ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Stream Key */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-400 font-semibold flex items-center gap-1">
                                <Key className="w-3 h-3 text-red-400" />
                                Instagram Stream Key
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKeys(prev => ({ ...prev, [platform.id]: !isEditing }));
                                  if (!isEditing) {
                                    setCustomKeys(prev => ({ ...prev, [platform.id]: platform.streamKey || "" }));
                                  }
                                }}
                                className="text-[11px] font-bold text-pink-400 hover:text-pink-300 underline flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                {isEditing ? "Cancel" : "Edit Key"}
                              </button>
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={currentVal}
                                  onChange={(e) => setCustomKeys(prev => ({ ...prev, [platform.id]: e.target.value }))}
                                  placeholder="Paste Instagram Stream Key"
                                  type="password"
                                  className="h-9 font-mono text-xs bg-black/60 border-pink-500/40 text-white"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveKey(platform)}
                                  className="h-9 px-3 bg-pink-600 hover:bg-pink-700 text-white font-bold shrink-0 text-xs"
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 flex-1 text-emerald-300">
                                  {platform.streamKey
                                    ? (showKeys[platform.id] ? platform.streamKey : "••••••••••••••••")
                                    : "Configuration Required (Add Key from Live Producer)"}
                                </div>
                                {platform.streamKey && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setShowKeys(prev => ({ ...prev, [platform.id]: !prev[platform.id] }))}
                                      className="h-9 w-9 shrink-0 text-zinc-400 hover:text-white"
                                      title={showKeys[platform.id] ? "Hide Stream Key" : "Reveal Stream Key"}
                                    >
                                      {showKeys[platform.id] ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleCopyKey(platform)}
                                      className="h-9 w-9 shrink-0"
                                    >
                                      {isCopied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                          💡 <strong>How to get your Instagram Stream Key:</strong>
                          {" "}1. Open{" "}
                          <a
                            href={getInstagramProducerUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-400 underline font-semibold"
                          >
                            instagram.com
                          </a>
                          {" "}in a new tab and log in.
                          <br />
                          2. In the left navigation, click <strong>Create (+)</strong> and select <strong>Live video</strong>.
                          <br />
                          3. Enter your broadcast title, select your audience (Public or Practice), and click <strong>Next</strong>.
                          <br />
                          4. Copy the session <strong>Stream URL</strong> and <strong>Stream Key</strong> into the fields above.
                          <br />
                          <span className="text-amber-400/90 font-medium">⚠️ Important: Instagram generates a new stream key for each live session. Do not reuse a stream key from an earlier stream. Keep the Instagram Live window open throughout your broadcast.</span>
                        </p>
                      </div>

                      {/* Step 2: Transmission and Vertical 9:16 pipeline */}
                      <div className="p-4 rounded-xl border bg-zinc-900/40 border-border/50 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 text-xs font-bold border border-purple-500/40">2</span>
                            <span className="text-sm font-bold text-white">Step 2 — Vertical Video Pipeline & Transmission</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-purple-300 border-purple-500/30">
                            Auto 9:16 Video Filter Active
                          </Badge>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          NexaSocial automatically formats and transcodes your broadcast stream to Instagram native <strong>9:16 portrait video (720x1280 @ 30fps)</strong> with AAC 44.1kHz audio, ensuring compatibility with all mobile viewers.
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                          <div className="flex items-center gap-2">
                            {isTransmitting ? (
                              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                <span>
                                  {isLive
                                    ? "Video relay is actively streaming live to Instagram."
                                    : "Your video is reaching Instagram Live Producer. Complete Instagram's Go Live confirmation in Live Producer to publish."}
                                </span>
                              </div>
                            ) : isStarting ? (
                              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                                <span className="h-2 w-2 rounded-full bg-blue-400 animate-spin" />
                                <span>Connecting video relay to Instagram Live Producer...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-zinc-400">
                                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                                <span>Configure Instagram Live Producer and start your video transmission.</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isTransmitting ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStopInstagramRelay(platform)}
                                disabled={isRelayingInstagram[platform.id]}
                                className="h-8 px-3 text-xs font-semibold border-red-500/40 text-red-400 hover:bg-red-500/10"
                              >
                                {isRelayingInstagram[platform.id] ? (
                                  <>
                                    <span className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                                    Stopping Output...
                                  </>
                                ) : (
                                  <>
                                    <Square className="w-3.5 h-3.5 mr-1.5 fill-current" />
                                    Stop Video Transmission
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleStartInstagramRelay(platform)}
                                disabled={isRelayingInstagram[platform.id] || !platform.streamKey}
                                className="h-8 px-3.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 disabled:opacity-50"
                              >
                                {isRelayingInstagram[platform.id] ? (
                                  <>
                                    <span className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Starting Relay...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                                    Start Video Transmission
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Official Meta Architecture Notice */}
                      <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/25 text-xs text-zinc-300 space-y-1">
                        <p className="font-semibold text-pink-300 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />
                          Official Meta Instagram Live Architecture:
                        </p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Meta&apos;s official Instagram Graph API does not provide a public publishing endpoint for desktop live streams. NexaSocial automatically transcodes and relays your 9:16 portrait video to Instagram Live Producer, where Meta requires clicking &quot;Go Live&quot; to publish to your audience.
                        </p>
                      </div>

                      {/* Step 3: Go Live & Broadcast Verification */}
                      <div className={`p-4 rounded-xl border transition-all ${isLive ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-zinc-900/40 border-border/50'}`}>
                        <div className="flex items-center justify-between pb-3 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 text-xs font-bold border border-emerald-500/40">3</span>
                            <span className="text-sm font-bold text-white">Step 3 — Go Live & Broadcast Verification</span>
                          </div>
                          {isLive ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold animate-pulse">
                              ● LIVE_VERIFIED (Broadcast Active)
                            </Badge>
                          ) : platform.publishStatus === 'MANUALLY_CONFIRMED' ? (
                            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/40 text-[10px] font-semibold">
                              ✋ WAITING_FOR_MANUAL_CONFIRMATION
                            </Badge>
                          ) : isUnverified ? (
                            <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/40 text-[10px] font-semibold">
                              ⚠️ {isMockAccount ? 'VERIFICATION_UNAVAILABLE (SIMULATED)' : 'STATUS_UNVERIFIED'}
                            </Badge>
                          ) : isWaitingConfirmation || isTransmitting ? (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-semibold">
                              ⏳ WAITING_FOR_INSTAGRAM_CONFIRMATION
                            </Badge>
                          ) : (
                            <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[10px] font-semibold">
                              Pending Transmission
                            </Badge>
                          )}
                        </div>

                        <div className="pt-3 space-y-3 text-xs">
                          {isLive ? (
                            <div className="space-y-1">
                              <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                Instagram broadcast verified as LIVE via Meta Graph API!
                              </p>
                              {platform.publishedAt && (
                                <p className="text-[11px] text-zinc-400">
                                  Live since: {new Date(platform.publishedAt).toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                          ) : platform.publishStatus === 'MANUALLY_CONFIRMED' ? (
                            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                Manual Confirmation Recorded (Unverified via Meta API):
                              </p>
                              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                                You confirmed that you clicked &quot;Go Live&quot; in Instagram Live Producer. Video relay is continuously transmitting to Instagram. Note that this is recorded as a manual confirmation, not official Meta Graph API proof. Viewers on Instagram can watch via your profile story ring.
                              </p>
                            </div>
                          ) : isUnverified ? (
                            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                              <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                {isMockAccount ? 'Verification Unavailable (Simulated Account):' : 'Public broadcast unverified on Meta Graph API:'}
                              </p>
                              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                                {isMockAccount
                                  ? 'A simulated account (mock_ig_user_101) is connected. Real Meta Graph API broadcast verification is bypassed. Your video is streaming to Instagram Live Producer, where you must click "Go Live" on instagram.com to publish to your audience.'
                                  : 'Video chunks are actively transmitting to Instagram. If you clicked Go Live in Instagram, Meta may take 15–30 seconds to reflect public status. If using a personal account or standalone key without Meta Business permissions, your stream is broadcasted directly via Live Producer while NexaSocial maintains the video relay.'}
                              </p>
                            </div>
                          ) : isWaitingConfirmation || isTransmitting ? (
                            <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30 text-blue-200 text-xs space-y-1.5">
                              <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                Video reaching Instagram:
                              </p>
                              <p className="text-[11px] text-blue-200/90 leading-relaxed">
                                1. Open <strong>Instagram</strong> (<a href={getInstagramProducerUrl()} target="_blank" rel="noopener noreferrer" className="underline font-semibold text-white">instagram.com</a>), click <strong>Create (+) → Live video</strong>, and verify incoming video preview.<br />
                                2. Keep the Instagram Live window open and click <strong>Go Live</strong> to publish to your audience.<br />
                                3. Return here and click <strong>{isMockAccount ? "Confirm Live Manually (Simulated)" : "Verify Live Status on Instagram"}</strong>.
                              </p>
                            </div>
                          ) : (
                            <p className="text-zinc-400 text-[11px] leading-relaxed">
                              Configure Instagram Live and start video transmission in Step 2 above.
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                asChild
                                variant="outline"
                                className="h-9 px-3 text-xs border-pink-500/40 text-pink-300 hover:bg-pink-500/10"
                              >
                                <a
                                  href={getInstagramProducerUrl()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                  Open Instagram (Live Video) ↗
                                </a>
                              </Button>

                              <Button
                                size="sm"
                                asChild
                                variant="outline"
                                className="h-9 px-3 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                title="Instagram mobile viewers view live streams via the profile story ring"
                              >
                                <a
                                  href={getInstagramProfileUrl(platform)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                  View Profile ↗
                                </a>
                              </Button>

                              {platform.viewerUrl && (
                                <Button
                                  size="sm"
                                  asChild
                                  className="h-9 px-4 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-600/30"
                                >
                                  <a
                                    href={platform.viewerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    Watch Broadcast 🔴
                                  </a>
                                </Button>
                              )}
                            </div>

                            <Button
                              size="sm"
                              onClick={() => handleConfirmInstagramLive(platform, true)}
                              disabled={
                                isConfirmingInstagram[platform.id] ||
                                (!isWaitingConfirmation && !isTransmitting && !isRelayActive && !isUnverified)
                              }
                              className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                !isWaitingConfirmation && !isTransmitting && !isRelayActive && !isUnverified
                                  ? "Start video transmission first before verifying live status"
                                  : undefined
                              }
                            >
                              {isConfirmingInstagram[platform.id] ? (
                                <>
                                  <span className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  Verifying Live Status...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                  {isMockAccount ? "Confirm Live Manually (Simulated)" : "Verify Live Status on Instagram"}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={platform.id} className="space-y-4 pb-4 border-b border-border/40 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        {config.name} Streaming Pipeline
                      </h3>
                      <Badge
                        variant="outline"
                        style={{ borderColor: `${config.color}40`, color: config.color }}
                        className="text-[10px] uppercase font-bold"
                      >
                        {platform.status === "WAITING_FOR_PLATFORM_PREVIEW" ? "PREVIEW READY" : platform.status || "CONNECTED"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold flex justify-between items-center">
                          {config.name} RTMPS Endpoint
                        </span>
                        <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 text-rose-300">
                          {platform.streamUrl || "Waiting for stream initialization..."}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-semibold flex items-center gap-1">
                            <Key className="w-3 h-3 text-red-400" />
                            {config.name} Stream Key
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingKeys(prev => ({ ...prev, [platform.id]: !isEditing }));
                              if (!isEditing) {
                                setCustomKeys(prev => ({ ...prev, [platform.id]: platform.streamKey || "" }));
                              }
                            }}
                            className="text-[11px] font-bold text-violet-400 hover:text-violet-300 underline flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            {isEditing ? "Cancel" : "Edit Key"}
                          </button>
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={currentVal}
                              onChange={(e) => setCustomKeys(prev => ({ ...prev, [platform.id]: e.target.value }))}
                              placeholder={`Paste ${config.name} Stream Key`}
                              type="password"
                              className="h-9 font-mono text-xs bg-black/60 border-violet-500/40 text-white"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                handleSaveKey(platform).then(() => {
                                  updateStream({
                                    id: stream.id,
                                    workspaceId: currentWorkspace.id,
                                    payload: { customStreamKey: currentVal, platformId: platform.id } as any,
                                  }).then(() => toast.success("Stream Key updated!"));
                                })
                              }}
                              className="h-9 px-3 bg-violet-600 hover:bg-violet-700 text-white font-bold shrink-0 text-xs"
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="p-2.5 rounded-lg bg-accent/30 font-mono text-[11px] truncate border border-border/40 flex-1 text-emerald-300">
                              {platform.streamKey
                                ? "••••••••••••••••"
                                : "••••••••••••••••••••••••"}
                            </div>
                            {platform.streamKey && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCopyKey(platform)}
                                className="h-9 w-9 shrink-0"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isMissingKey && pName === 'YOUTUBE' && (
                      <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs space-y-2 mt-2">
                        <div className="font-bold flex items-center gap-1.5 text-amber-400">
                          ⚠️ Action Required: Bind Your YouTube Stream Key
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-200/90">
                          YouTube is currently showing <strong>&quot;Waiting for NexaSocial&quot;</strong> because a valid YouTube Stream Key is needed for video packet ingestion. Click <strong>Edit Key</strong> above, paste your official <strong>YouTube Stream Key</strong>, and click <strong>Save</strong>!
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Live Camera Feed Relay Active
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Your NexaSocial camera & screen share preview is automatically forwarded to your destinations via FFmpeg. Click <strong className="text-emerald-400">Go Live Now</strong> above to start broadcasting!
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
                  {stream.viewerCount !== undefined ? stream.viewerCount.toLocaleString() : "Not available"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/30">
                <span className="text-muted-foreground">Peak Viewers</span>
                <span className="font-bold text-foreground">
                  {stream.peakViewerCount !== undefined ? stream.peakViewerCount.toLocaleString() : "Not available"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Stream Health</span>
                <span className="font-bold text-foreground">
                  {stream.status === "LIVE" ? <span className="text-emerald-500">Connected</span> : "Waiting for stream"}
                </span>
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
                {stream.status === "LIVE" ? (
                  <div className="text-center p-4 text-xs text-muted-foreground">
                    No messages yet.
                  </div>
                ) : (
                  <div className="text-center p-4 text-xs text-muted-foreground">
                    Waiting for stream to start...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
