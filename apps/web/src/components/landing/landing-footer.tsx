'use client';

import Link from 'next/link';
import { Radio, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 py-12 sm:py-16 px-6 lg:px-12 relative z-10 bg-card/60 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 text-xs text-muted-foreground">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-base shadow-md group-hover:scale-105 transition-transform">
              N
            </div>
            <span className="font-black text-xl text-foreground tracking-tight">
              NexaSocial
            </span>
          </Link>

          <p className="max-w-sm text-muted-foreground leading-relaxed text-xs">
            Enterprise multi-destination live streaming & AI content distribution platform. One operator for every social leg of your broadcast journey.
          </p>

          <div className="flex items-center gap-2.5 text-[11px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>All 7 Platform APIs Operational (99.99% SLA)</span>
          </div>
        </div>

        {/* Product Navigation */}
        <div className="space-y-3">
          <div className="font-extrabold text-foreground text-xs uppercase tracking-wider font-mono">Product</div>
          <ul className="space-y-2 font-medium">
            <li><a href="#pipeline" className="hover-un hover:text-foreground transition-colors">Journey Pipeline</a></li>
            <li><a href="#demo" className="hover-un hover:text-foreground transition-colors">Command Studio</a></li>
            <li><a href="#features" className="hover-un hover:text-foreground transition-colors">Analytics Engine</a></li>
            <li><a href="#features" className="hover-un hover:text-foreground transition-colors">AI Script Copilot</a></li>
            <li><a href="#pricing" className="hover-un hover:text-foreground transition-colors">Pricing Tiers</a></li>
          </ul>
        </div>

        {/* Supported Channels */}
        <div className="space-y-3">
          <div className="font-extrabold text-foreground text-xs uppercase tracking-wider font-mono">Destinations</div>
          <ul className="space-y-2 font-medium">
            <li><a href="#platforms" className="hover-un hover:text-foreground transition-colors">YouTube Live</a></li>
            <li><a href="#platforms" className="hover-un hover:text-foreground transition-colors">Facebook Live</a></li>
            <li><a href="#platforms" className="hover-un hover:text-foreground transition-colors">Instagram Live</a></li>
            <li><a href="#platforms" className="hover-un hover:text-foreground transition-colors">X / Twitter Spaces</a></li>
          </ul>
        </div>

        {/* Account & Legal */}
        <div className="space-y-3">
          <div className="font-extrabold text-foreground text-xs uppercase tracking-wider font-mono">Legal & Access</div>
          <ul className="space-y-2 font-medium">
            <li><Link href="/login" className="hover-un hover:text-foreground transition-colors">Sign In</Link></li>
            <li><Link href="/register" className="hover-un hover:text-foreground transition-colors">Start Trial</Link></li>
            <li><span className="hover-un hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span></li>
            <li><span className="hover-un hover:text-foreground transition-colors cursor-pointer">Terms of Service</span></li>
            <li><span className="hover-un hover:text-foreground transition-colors cursor-pointer">Security & Compliance</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-4 font-mono">
        <div>© 2026 NexaSocial Enterprise Platform. Built for Creators Worldwide.</div>
        <div className="flex items-center gap-6">
          <span className="hover-un hover:text-foreground cursor-pointer">API Docs</span>
          <span className="hover-un hover:text-foreground cursor-pointer">System Status</span>
          <span className="hover-un hover:text-foreground cursor-pointer">Support Desk</span>
        </div>
      </div>
    </footer>
  );
}

