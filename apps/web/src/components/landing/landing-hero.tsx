'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Play,
  Radio,
  Activity,
  Zap,
  Globe2,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingHero() {
  return (
    <section className="text-center space-y-8 max-w-5xl mx-auto pt-6 sm:pt-12 pb-12 sm:pb-16 relative z-10">
      {/* Floating background pill indicators - Desktop view */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden lg:flex absolute -left-12 top-16 items-center gap-2.5 px-3.5 py-2 rounded-full bg-violet-600/10 border border-violet-500/30 text-xs font-mono text-violet-300 backdrop-blur-md shadow-xl"
      >
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>RTMP Ingest: 1080p60</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="hidden lg:flex absolute -right-12 top-28 items-center gap-2.5 px-3.5 py-2 rounded-full bg-cyan-600/10 border border-cyan-500/30 text-xs font-mono text-cyan-300 backdrop-blur-md shadow-xl"
      >
        <Activity className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
        <span>7 Destinations Active</span>
      </motion.div>

      {/* Enterprise SaaS Badge */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-center"
      >
        <Badge className="px-4 py-2 rounded-full bg-violet-500/10 text-violet-300 border-violet-500/30 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md hover:bg-violet-500/20 transition-all cursor-pointer shadow-lg shadow-violet-500/10">
          <Sparkles className="w-4 h-4 mr-2 inline text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>One Operator for Every Social Destination & Live Stream</span>
        </Badge>
      </motion.div>

      {/* Main Split Title (Inspired by United Carriers text highlighting) */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08]"
      >
        Broadcast everywhere.{' '}
        <span className="block sm:inline split-text-reveal">
          Publish seamlessly.
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2"
      >
        Unified control across <strong className="text-foreground font-semibold">YouTube, Instagram, TikTok, X, LinkedIn, Facebook & Twitch</strong>.
        Stream 1080p60 video simultaneously and schedule multi-channel AI content from a single command deck.
      </motion.p>

      {/* Primary & Secondary Call to Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
      >
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto h-13 px-8 text-sm font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 shadow-xl shadow-violet-500/25 hover:scale-105 hover:shadow-violet-500/40 transition-all rounded-xl"
        >
          <Link href="/register" className="flex items-center justify-center gap-2">
            <span>Launch Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full sm:w-auto h-13 px-8 text-sm font-semibold border-white/10 bg-white/5 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all rounded-xl backdrop-blur-md"
        >
          <a href="#demo" className="flex items-center justify-center gap-2">
            <Play className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            <span>Watch Live Studio Demo</span>
          </a>
        </Button>
      </motion.div>

      {/* Key Metrics Bar (Inspired by United Carriers stats section) */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto"
      >
        <div className="p-4 rounded-2xl bg-card/40 border border-white/5 backdrop-blur-md text-left hover:border-violet-500/30 transition-colors">
          <div className="flex items-center gap-2 text-violet-400 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">Latency</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">&lt; 15 ms</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ultra-fast RTMP edge relay</p>
        </div>

        <div className="p-4 rounded-2xl bg-card/40 border border-white/5 backdrop-blur-md text-left hover:border-indigo-500/30 transition-colors">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Globe2 className="w-4 h-4" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">Destinations</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">7+ Networks</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Simultaneous broadcast</p>
        </div>

        <div className="p-4 rounded-2xl bg-card/40 border border-white/5 backdrop-blur-md text-left hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">Reliability</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">99.99%</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Guaranteed publish SLA</p>
        </div>

        <div className="p-4 rounded-2xl bg-card/40 border border-white/5 backdrop-blur-md text-left hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">AI Speed</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">10x Faster</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Smart post generator</p>
        </div>
      </motion.div>

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-4"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          No Credit Card Required
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          14-Day Unlimited Free Trial
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Instant OAuth Connection
        </span>
      </motion.div>
    </section>
  );
}

