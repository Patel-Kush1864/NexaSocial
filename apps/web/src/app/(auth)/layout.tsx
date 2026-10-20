'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { LandingBackgroundAnimation } from '@/components/landing/landing-background-animation';
import {
  ArrowLeft,
  Radio,
  Activity,
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Globe2,
  Tv,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const platforms = [
    { name: 'YouTube', color: 'from-red-500 to-rose-600', active: true },
    { name: 'Instagram', color: 'from-pink-500 via-purple-500 to-orange-500', active: true },
    { name: 'Facebook', color: 'from-blue-500 to-indigo-600', active: true },
    { name: 'X / Twitter', color: 'from-slate-700 to-slate-900', active: true },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden flex flex-col font-sans selection:bg-violet-500/20 selection:text-violet-300">
      {/* Background Animated Orbs & Parallax Particles */}
      <LandingBackgroundAnimation />

      {/* Top Header Navigation Bar */}
      <header className="relative z-20 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
              N
            </div>
            <span className="font-extrabold text-xl tracking-tight gradient-text">
              NexaSocial
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>RTMP Relay Engine Online</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 border border-white/10 backdrop-blur-md transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 relative z-10 grid lg:grid-cols-12 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-10 gap-8 items-center">
        {/* Left Column: Command Center Telemetry & Brand Showcase (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-semibold text-violet-300 backdrop-blur-md shadow-lg shadow-violet-500/10">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>One Operator for Every Social Destination</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]">
              Broadcast everywhere.{' '}
              <span className="block split-text-reveal pt-1">
                Publish seamlessly.
              </span>
            </h1>

            <p className="text-base text-muted-foreground leading-relaxed">
              Unified command center across <strong className="text-foreground font-semibold">YouTube, Instagram, Facebook & X</strong>. Stream 1080p60 video simultaneously and manage AI multi-platform publishing from one unified deck.
            </p>
          </motion.div>

          {/* Real-Time Live Telemetry Metrics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="p-5 rounded-2xl glass-panel border border-violet-500/20 bg-background/40 backdrop-blur-2xl space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between text-xs font-mono border-b border-border/40 pb-3">
              <div className="flex items-center gap-2 text-violet-300">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-bold">LIVE TELEMETRY FEED</span>
              </div>
              <span className="text-emerald-400 font-semibold">99.99% Latency SLA</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-xs text-muted-foreground">RTMP Stream</div>
                <div className="text-sm font-bold font-mono text-cyan-300 mt-1">1080p60</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-xs text-muted-foreground">Edge Latency</div>
                <div className="text-sm font-bold font-mono text-emerald-400 mt-1">&lt;15ms</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-xs text-muted-foreground">Simulcast</div>
                <div className="text-sm font-bold font-mono text-violet-300 mt-1">7 Destinations</div>
              </div>
            </div>

            {/* 7 Connected Platforms Pills */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Supported Platforms & Ingest Relays
              </div>
              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <span
                    key={p.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-foreground/90 backdrop-blur-sm"
                  >
                    <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${p.color}`} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Testimonial Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="p-5 rounded-2xl glass-card border border-white/10 space-y-3"
          >
            <p className="text-xs sm:text-sm text-foreground/90 italic leading-relaxed">
              “NexaSocial completely transformed our broadcasting workflow. We stream to 5 platforms simultaneously with zero frame drops and 100% automated clip highlights.”
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
                AK
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Alex Chen</p>
                <p className="text-[11px] text-muted-foreground">Head of Live Production, MediaCorp</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Form Container */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Auth Footer */}
      <footer className="relative z-20 w-full border-t border-border/40 py-4 bg-background/40 backdrop-blur-md mt-auto text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>© 2026 NexaSocial. All rights reserved. Enterprise Social Command Center.</div>
          <div className="flex items-center gap-5">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>

            <Link href="#" className="hover:text-foreground transition-colors">
              System Status
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
