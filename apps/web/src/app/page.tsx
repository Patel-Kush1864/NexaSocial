'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Radio,
  BarChart3,
  Building2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="h-20 border-b border-border/40 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/25">
            N
          </div>
          <span className="font-bold text-2xl tracking-tight gradient-text">
            NexaSocial
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="text-xs font-semibold">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            className="h-10 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25"
          >
            <Link href="/register">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 space-y-20 relative z-10">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge className="px-4 py-1 rounded-full bg-violet-500/10 text-violet-400 border-violet-500/20 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 inline text-amber-400" />
            Enterprise Multi-Destination Live Streaming & Social SaaS
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Broadcast everywhere.{' '}
            <span className="gradient-text">Publish smarter.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect YouTube, Facebook, Instagram, LinkedIn, X, Twitch, and TikTok. Stream 1080p multi-destination video and manage audience analytics in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/30"
            >
              <Link href="/register">
                Launch Command Center
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-sm font-semibold glass-panel"
            >
              <Link href="/login">Live Demo Studio</Link>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              14-Day Free Trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              7 Major Platforms
            </span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl glass-panel space-y-4 hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Multi-Platform Live Streaming</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Broadcast live RTMP video streams simultaneously to YouTube, Twitch, Facebook, and custom endpoints with zero latency.
            </p>
          </div>

          <div className="p-8 rounded-2xl glass-panel space-y-4 hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Cross-Channel Analytics</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unified audience growth, engagement metrics, impression counts, and performance reports across all connected accounts.
            </p>
          </div>

          <div className="p-8 rounded-2xl glass-panel space-y-4 hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-pink-600/10 text-pink-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Multi-Tenant Workspaces</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Isolate clients, team members, and social credentials into dedicated workspaces with role-based access control.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6 text-center text-xs text-muted-foreground">
        © 2026 NexaSocial SaaS Platform. All rights reserved.
      </footer>
    </div>
  );
}
