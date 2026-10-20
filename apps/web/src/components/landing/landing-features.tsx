'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Radio,
  BarChart3,
  Building2,
  Sparkles,
  CalendarClock,
  MessageSquareText,
  ShieldCheck,
  Zap,
  Globe2,
} from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: Radio,
    color: 'text-violet-400',
    bg: 'bg-violet-600/10',
    accentBorder: 'group-hover:border-violet-500/50',
    title: 'Multi-Platform Live Streaming',
    tag: '1080p60 Ultra-Low Latency',
    description:
      'Broadcast 1080p RTMP video streams simultaneously to YouTube, Facebook, Instagram, X, and custom RTMP endpoints with sub-15ms latency.',
  },
  {
    icon: BarChart3,
    color: 'text-indigo-400',
    bg: 'bg-indigo-600/10',
    accentBorder: 'group-hover:border-indigo-500/50',
    title: 'Cross-Channel Real-Time Analytics',
    tag: '30-Day Automated Reports',
    description:
      'Unified audience growth, watch time, engagement metrics, impression counts, and exportable executive PDF reports across all channels.',
  },
  {
    icon: Building2,
    color: 'text-cyan-400',
    bg: 'bg-cyan-600/10',
    accentBorder: 'group-hover:border-cyan-500/50',
    title: 'Multi-Tenant Workspaces',
    tag: 'Role-Based Control',
    description:
      'Isolate clients, team members, and social credentials into dedicated workspaces with custom permission levels and brand locks.',
  },
  {
    icon: Sparkles,
    color: 'text-amber-400',
    bg: 'bg-amber-600/10',
    accentBorder: 'group-hover:border-amber-500/50',
    title: 'AI Content & Script Engine',
    tag: 'Viral Hook Generator',
    description:
      'Generate optimized video titles, description copy, viral hashtags, and multi-language captions in seconds using tailored AI models.',
  },
  {
    icon: CalendarClock,
    color: 'text-emerald-400',
    bg: 'bg-emerald-600/10',
    accentBorder: 'group-hover:border-emerald-500/50',
    title: 'Smart Queue & Timezone Dispatch',
    tag: 'AI Best-Time Matrix',
    description:
      'Queue video clips, shorts, and carousel posts across all platforms with timezone-aware predictive scheduling algorithms.',
  },
  {
    icon: MessageSquareText,
    color: 'text-rose-400',
    bg: 'bg-rose-600/10',
    accentBorder: 'group-hover:border-rose-500/50',
    title: 'Unified Social Live Inbox',
    tag: 'Cross-Platform Chat Sync',
    description:
      'Monitor and reply to live comments, direct messages, and brand mentions from all platforms in one central unified inbox.',
  },
];

export function LandingFeatures() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section id="features" className="py-16 sm:py-24 space-y-12 relative z-10 scroll-mt-24">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="outline" className="px-4 py-1.5 text-xs border-violet-500/30 text-violet-300 bg-violet-500/10">
          <Zap className="w-3.5 h-3.5 mr-1.5 inline text-amber-400" />
          Engineered for High-Volume Creators & Agencies
        </Badge>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Everything you need to <span className="gradient-text">scale your audience</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          NexaSocial consolidates multi-streaming, AI content drafting, analytics, and team governance into a single high-performance command platform.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              onMouseMove={handleMouseMove}
              className={`p-8 rounded-3xl glass-card space-y-5 border border-white/10 ${feature.accentBorder} hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden`}
            >
              {/* Radial Mouse Spotlight Glow */}
              <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.12), transparent 40%)`,
                }}
              />

              <div className="flex items-center justify-between">
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                  <Icon className="w-7 h-7" />
                </div>
                <Badge className="bg-white/5 border border-white/10 text-muted-foreground text-[10px] font-mono px-2.5 py-1">
                  {feature.tag}
                </Badge>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-foreground tracking-tight group-hover:text-violet-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center text-[11px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span>Enterprise SLA Included</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

