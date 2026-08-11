'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Radio, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingCTA() {
  const [email, setEmail] = useState('');

  return (
    <section className="py-16 sm:py-24 relative z-10">
      <div className="rounded-3xl bg-gradient-to-r from-violet-950/80 via-purple-950/60 to-indigo-950/80 border border-violet-500/30 p-8 sm:p-16 text-center space-y-8 max-w-5xl mx-auto shadow-2xl relative overflow-hidden glass-card">
        {/* Animated Background Mesh Glow Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Ready for Next-Gen Multi-Broadcasting?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Start streaming everywhere in <span className="split-text-reveal">under 2 minutes.</span>
          </h2>

          <p className="text-sm sm:text-lg text-violet-200/80 max-w-2xl mx-auto leading-relaxed">
            Join thousands of video creators, broadcasting networks, and marketing agencies using NexaSocial to scale their cross-channel reach.
          </p>

          {/* Quick Email Launcher Form */}
          <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="email"
              placeholder="Enter your creator email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-black/50 border border-white/20 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-violet-400 font-mono transition-all"
            />
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-7 text-xs font-extrabold bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 text-white shadow-xl shadow-violet-500/30 hover:scale-105 transition-all rounded-xl shrink-0"
            >
              <Link href={`/register${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="flex items-center justify-center gap-2">
                <span>Start Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Quick Features Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-violet-200/70 pt-2 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Instant OBS & vMix Setup
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              7 Platforms Supported
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

