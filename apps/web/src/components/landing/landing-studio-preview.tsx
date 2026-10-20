'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Radio,
  Wifi,
  Users,
  Eye,
  MessageSquare,
  Activity,
  CheckCircle,
  Video,
  Volume2,
  Settings2,
  Share2,
  Sparkles,
  Layers,
  Bot,
  Calendar,
  BarChart3,
  Sliders,
  Send,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_DESTINATIONS = [
  { id: 'yt', name: 'YouTube Live', icon: '📺', active: true, viewers: '4.2k', status: 'LIVE' },
  { id: 'fb', name: 'Facebook Live', icon: '📘', active: true, viewers: '2.5k', status: 'LIVE' },
  { id: 'ig', name: 'Instagram Live', icon: '📸', active: true, viewers: '3.1k', status: 'LIVE' },
  { id: 'x', name: 'X / Twitter Spaces', icon: '𝕏', active: true, viewers: '1.4k', status: 'LIVE' },
];

const MOCK_CHAT_MESSAGES = [
  { user: 'Alex_Streamer', platform: '📸', text: '1080p60 stream is crystal clear!' },
  { user: 'SarahTech', platform: '📺', text: 'Love the instant multi-destination sync 👌' },
  { user: 'DevDavid', platform: '📘', text: 'Bitrate looks rock solid 🔥' },
  { user: 'Elena_V', platform: '𝕏', text: 'Super clean dashboard UI!' },
  { user: 'GamerX99', platform: '📸', text: 'Zero frame drop recorded!' },
];

export function LandingStudioPreview() {
  const [activeTab, setActiveTab] = useState<'stream' | 'ai' | 'analytics' | 'queue'>('stream');
  const [destinations, setDestinations] = useState(INITIAL_DESTINATIONS);
  const [isLive, setIsLive] = useState(true);
  const [bitrate, setBitrate] = useState(6240);
  const [totalViewers, setTotalViewers] = useState(10490);
  const [chatIndex, setChatIndex] = useState(0);
  const [seconds, setSeconds] = useState(5078);
  const [promptText, setPromptText] = useState('Create a 30s product launch announcement for Next-Gen Social AI');

  // Auto update telemetry stats
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const jitter = Math.floor(Math.random() * 240) - 120;
      setBitrate((prev) => Math.max(5800, Math.min(6500, prev + jitter)));

      const viewerDiff = Math.floor(Math.random() * 30) - 12;
      setTotalViewers((prev) => prev + viewerDiff);

      setChatIndex((prev) => (prev + 1) % MOCK_CHAT_MESSAGES.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isLive]);

  // Auto increment live stream timer
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive]);

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `REC ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const toggleDestination = (id: string) => {
    setDestinations((prev) =>
      prev.map((dest) => {
        if (dest.id === id) {
          const nextActive = !dest.active;
          return {
            ...dest,
            active: nextActive,
            status: nextActive ? 'LIVE' : 'STANDBY',
            viewers: nextActive ? `${(Math.random() * 3 + 1).toFixed(1)}k` : '0',
          };
        }
        return dest;
      })
    );
  };

  const activeCount = destinations.filter((d) => d.active).length;
  const currentChat = MOCK_CHAT_MESSAGES[chatIndex];

  return (
    <section id="demo" className="py-12 sm:py-20 relative z-10 scroll-mt-24">
      {/* Header Text */}
      <div className="text-center space-y-4 mb-10 max-w-3xl mx-auto">
        <Badge variant="outline" className="px-4 py-1.5 text-xs border-violet-500/30 text-violet-300 bg-violet-500/10">
          <Sliders className="w-3.5 h-3.5 mr-1.5 inline text-cyan-400" />
          Interactive Studio Cockpit
        </Badge>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Test-drive the <span className="gradient-text">Nexa Command Studio</span>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Switch between live RTMP broadcasting, AI post creation, multi-channel analytics, and queue dispatch in real time.
        </p>

        {/* Studio Mode Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setActiveTab('stream')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'stream'
                ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-500/30'
                : 'bg-card/40 border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>1080p Live Streamer</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'ai'
                ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-500/30'
                : 'bg-card/40 border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Content Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'analytics'
                ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-500/30'
                : 'bg-card/40 border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cross-Channel Deck</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'queue'
                ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-500/30'
                : 'bg-card/40 border-white/10 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Smart Queue Matrix</span>
          </button>
        </div>
      </div>

      {/* Mock Studio Window Container */}
      <div className="rounded-3xl border border-white/10 glass-panel overflow-hidden shadow-2xl max-w-5xl mx-auto bg-card/90">
        {/* Studio Title Bar */}
        <div className="bg-muted/80 px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-3 text-xs font-mono text-muted-foreground hidden sm:inline">
              studio.nexasocial.app // Mode: {activeTab.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 transition-colors ${
                isLive
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Radio className="w-3 h-3 mr-1 inline" />
              {isLive ? 'BROADCASTING LIVE' : 'OFFLINE'}
            </Badge>
            <Button
              size="sm"
              variant={isLive ? 'destructive' : 'default'}
              className="h-7 text-xs font-bold rounded-lg"
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? 'End Stream' : 'Go Live'}
            </Button>
          </div>
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {activeTab === 'stream' && (
            <motion.div
              key="stream-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/10 min-h-[420px]"
            >
              {/* Video Viewport Column */}
              <div className="lg:col-span-2 p-4 sm:p-6 flex flex-col justify-between space-y-4 bg-black/40">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2 font-mono">
                    <Video className="w-4 h-4 text-violet-400" /> 1080p @ 60fps (H.264 / NVENC)
                  </span>
                  <span className="flex items-center gap-2 font-mono text-emerald-400">
                    <Wifi className="w-3.5 h-3.5" /> {isLive ? `${bitrate.toLocaleString()} kbps` : '0 kbps'} (Stable)
                  </span>
                </div>

                <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-violet-950/60 via-slate-950 to-indigo-950/80 border border-violet-500/20 flex flex-col items-center justify-center overflow-hidden shadow-inner group">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
                    <span className="font-bold text-white tracking-wide font-mono">
                      {isLive ? formatTimer(seconds) : 'STANDBY'}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
                    <Users className="w-3.5 h-3.5 text-violet-400" />
                    <span className="font-bold font-mono">{isLive ? totalViewers.toLocaleString() : '0'}</span> Viewers
                  </div>

                  {isLive && (
                    <div className="absolute bottom-14 left-4 max-w-xs z-20">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={chatIndex}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="bg-black/85 backdrop-blur-md border border-violet-500/30 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-white shadow-xl"
                        >
                          <span>{currentChat.platform}</span>
                          <span className="font-bold text-violet-300">{currentChat.user}:</span>
                          <span className="text-white/90 truncate">{currentChat.text}</span>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="relative z-10 text-center space-y-3 p-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-violet-500/40 border border-white/20">
                      <Activity className="w-8 h-8 text-white animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-lg text-white">NexaSocial Live RTMP Ingestion</p>
                      <p className="text-xs text-violet-300/80">Broadcasting to {activeCount} social destinations simultaneously</p>
                    </div>
                  </div>

                  <div className="absolute bottom-3 inset-x-4 flex items-center justify-between bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-xs">
                    <div className="flex items-center gap-3 text-white">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-[11px]">Master Ingest Audio: -12 dB</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Settings2 className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                      <Share2 className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-violet-400" /> Impressions
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono">
                      {isLive ? `${(totalViewers * 5.2).toFixed(1)}k` : '0'}
                    </div>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Live Chat Rate
                    </div>
                    <div className="text-sm sm:text-base font-bold font-mono">1,240/min</div>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" /> Latency
                    </div>
                    <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono">1.2 sec</div>
                  </div>
                </div>
              </div>

              {/* Destinations Control Panel */}
              <div className="p-4 sm:p-6 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Radio className="w-4 h-4 text-violet-400" /> Destinations ({activeCount})
                    </h3>
                    <span className="text-[10px] text-muted-foreground">Click card to toggle</span>
                  </div>

                  <div className="space-y-2">
                    {destinations.map((dest) => (
                      <div
                        key={dest.id}
                        onClick={() => toggleDestination(dest.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          dest.active
                            ? 'bg-violet-500/10 border-violet-500/40 text-foreground shadow-sm'
                            : 'bg-white/5 border-white/5 text-muted-foreground opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{dest.icon}</span>
                          <div>
                            <div className="text-xs font-bold">{dest.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {dest.active ? `${dest.viewers} viewers` : 'Disconnected'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[9px] px-2 py-0.2 ${
                              dest.active
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {dest.status}
                          </Badge>
                          {dest.active && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 space-y-1 text-xs">
                  <div className="font-bold text-violet-300">OBS & vMix Key Ingest</div>
                  <p className="text-[11px] text-muted-foreground">
                    rtmp://live.nexasocial.io/app/live_nk_892314
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6 bg-black/40 min-h-[420px]"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-foreground">AI Social Post Copilot & Caption Studio</h3>
                </div>
                <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">
                  GPT-4o Vision Engine
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-xs font-mono text-muted-foreground block">
                    ENTER TOPIC OR PROMPT:
                  </label>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-foreground focus:outline-none focus:border-violet-500/50 resize-none font-mono"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPromptText('Create a viral thread introducing our live streaming feature set')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-violet-300 hover:bg-violet-500/10"
                    >
                      + Viral Thread Prompt
                    </button>
                    <button
                      onClick={() => setPromptText('Draft Instagram captions with top trending tech hashtags')}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-indigo-300 hover:bg-indigo-500/10"
                    >
                      + Instagram Captions
                    </button>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-violet-600 to-amber-600 text-xs font-bold h-10 gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate Optimized Social Package
                  </Button>
                </div>

                <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-b border-white/10 pb-2">
                    <span>GENERATED OUTPUT</span>
                    <span className="text-emerald-400">Viral Hook Score: 96/100</span>
                  </div>

                  <div className="space-y-2 text-xs text-foreground/90 font-mono leading-relaxed">
                    <p className="font-bold text-violet-300">
                      🚀 Big news for creators! Broadcast to 4 social platforms at once in 1080p60 with zero stream delay.
                    </p>
                    <p className="text-muted-foreground">
                      Whether you are hosting a live keynote or scheduling weekly video clips, NexaSocial handles it all from one command deck.
                    </p>
                    <p className="text-cyan-400">
                      #LiveStreaming #MultiStream #SaaS #ContentCreator #NexaSocial
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Platforms target: YouTube, Facebook, Instagram, X</span>
                    <span className="text-violet-400 font-bold">Ready to dispatch</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6 bg-black/40 min-h-[420px]"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-sm text-foreground">Cross-Channel Real-Time Growth Deck</h3>
                </div>
                <span className="text-xs font-mono text-muted-foreground">30-DAY PERFORMANCE AUDIT</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[11px] font-mono text-muted-foreground">TOTAL REACH</span>
                  <p className="text-2xl font-black font-mono text-foreground">4,892,100</p>
                  <span className="text-[10px] text-emerald-400 font-mono">↑ 34.2% this month</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[11px] font-mono text-muted-foreground">ENGAGEMENT RATE</span>
                  <p className="text-2xl font-black font-mono text-cyan-400">8.42%</p>
                  <span className="text-[10px] text-cyan-400 font-mono">Top 5% Industry Peer</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[11px] font-mono text-muted-foreground">STREAM HOURS</span>
                  <p className="text-2xl font-black font-mono text-violet-400">142 hrs</p>
                  <span className="text-[10px] text-violet-400 font-mono">Zero downtime</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[11px] font-mono text-muted-foreground">NEW FOLLOWERS</span>
                  <p className="text-2xl font-black font-mono text-amber-400">+12,840</p>
                  <span className="text-[10px] text-amber-400 font-mono">Across 4 networks</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>CHANNEL ENGAGEMENT DISTRIBUTION</span>
                  <span className="text-foreground">YouTube (42%) • Instagram (28%) • Facebook (18%) • X (12%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 flex overflow-hidden">
                  <div className="h-full bg-rose-500 w-[42%]" />
                  <div className="h-full bg-cyan-400 w-[28%]" />
                  <div className="h-full bg-indigo-500 w-[18%]" />
                  <div className="h-full bg-amber-400 w-[12%]" />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'queue' && (
            <motion.div
              key="queue-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 space-y-6 bg-black/40 min-h-[420px]"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-foreground">Smart Queue & Timezone Dispatch Matrix</h3>
                </div>
                <span className="text-xs font-mono text-emerald-400">14 Posts Ready in Queue</span>
              </div>

              <div className="space-y-3">
                {[
                  { time: 'Today @ 18:00 EST', channel: 'YouTube & Facebook', text: 'Live Q&A: Enterprise Multi-Streaming Setup', status: 'Scheduled' },
                  { time: 'Tomorrow @ 09:30 EST', channel: 'Instagram & X', text: '5 Key Social Analytics Metrics to Track in 2026', status: 'Approved' },
                  { time: 'Aug 14 @ 14:00 GMT', channel: 'Instagram Reels & X', text: 'Behind the Scenes of 1080p RTMP Ingest', status: 'Draft' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-violet-300">{item.time}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-muted-foreground">{item.channel}</span>
                      </div>
                      <p className="text-foreground/90 font-medium">{item.text}</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

