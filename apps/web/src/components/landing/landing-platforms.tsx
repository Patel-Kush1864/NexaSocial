'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, Server, Shield, Radio, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const PLATFORMS = [
  { name: 'YouTube Live', icon: '🔴', status: 'OAuth 2.0 + RTMP Ingest', category: 'Live & VOD', latency: '12ms', syncRate: '99.99%' },
  { name: 'Twitch', icon: '👾', status: 'OAuth + Helix API', category: 'Live Stream', latency: '10ms', syncRate: '99.98%' },
  { name: 'Facebook Live', icon: '📘', status: 'Pages & Groups API', category: 'Live Stream', latency: '15ms', syncRate: '99.95%' },
  { name: 'Instagram Live', icon: '📸', status: 'Professional Account API', category: 'Short Form', latency: '18ms', syncRate: '99.90%' },
  { name: 'X / Twitter', icon: '𝕏', status: 'Media Studio / API v2', category: 'Professional', latency: '14ms', syncRate: '99.97%' },
  { name: 'LinkedIn Live', icon: '💼', status: 'Pages & Executive Live', category: 'Professional', latency: '16ms', syncRate: '99.92%' },
  { name: 'TikTok Live', icon: '🎵', status: 'Stream Key Integration', category: 'Short Form', latency: '15ms', syncRate: '99.94%' },
  { name: 'Custom RTMP / SRT', icon: '🌐', status: 'Custom Server Endpoints', category: 'Live Stream', latency: '8ms', syncRate: '100.0%' },
];

export function LandingPlatforms() {
  const [filter, setFilter] = useState('All');
  const marqueeItems = [...PLATFORMS, ...PLATFORMS];

  const filteredPlatforms = filter === 'All'
    ? PLATFORMS
    : PLATFORMS.filter(p => p.category === filter || (filter === 'Live Stream' && (p.category === 'Live & VOD' || p.category === 'Live Stream')));

  return (
    <section id="platforms" className="py-16 sm:py-24 space-y-12 relative z-10 scroll-mt-24 overflow-hidden">
      {/* Header Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="outline" className="px-4 py-1.5 text-xs border-cyan-500/30 text-cyan-300 bg-cyan-500/10">
          <Globe className="w-3.5 h-3.5 mr-1.5 inline text-cyan-400" />
          Native API & RTMP Ingest Architecture
        </Badge>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Connect All Your Major Broadcast <span className="gradient-text">Destinations</span>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Single-click OAuth 2.0 authorization and automatic RTMP key binding for 7 major social channels.
        </p>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {['All', 'Live Stream', 'Short Form', 'Professional'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                filter === cat
                  ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-500/30'
                  : 'bg-card/40 border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Running Marquee Ribbon */}
      <div className="relative w-full overflow-hidden py-4">
        {/* Gradient Mask Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex w-max gap-6 animate-marquee">
          {marqueeItems.map((platform, i) => (
            <div
              key={i}
              className="w-64 p-6 rounded-2xl glass-card border border-white/10 hover:border-violet-500/40 transition-all text-left space-y-3 shrink-0 group hover:scale-[1.03] shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {platform.icon}
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px]">
                  <Zap className="w-2.5 h-2.5 mr-1 inline" />
                  {platform.latency}
                </Badge>
              </div>

              <div>
                <h4 className="font-extrabold text-base text-foreground tracking-tight">{platform.name}</h4>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{platform.status}</p>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>{platform.category}</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> {platform.syncRate} SLA
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Infrastructure Footer Badges */}
      <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-muted-foreground max-w-4xl mx-auto pt-6 border-t border-white/10">
        <span className="flex items-center gap-2 font-mono">
          <Server className="w-4 h-4 text-violet-400" /> Ultra-low Latency Ingest CDN
        </span>
        <span className="flex items-center gap-2 font-mono">
          <Shield className="w-4 h-4 text-emerald-400" /> 256-bit Encrypted Stream Vault
        </span>
        <span className="flex items-center gap-2 font-mono">
          <Globe className="w-4 h-4 text-cyan-400" /> 14 Global Edge Relay Nodes
        </span>
      </div>
    </section>
  );
}

