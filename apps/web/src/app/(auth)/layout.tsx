import type { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Left Banner Column (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-linear-to-br from-violet-950/40 via-background to-black/60 border-r border-border/50 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/25">
            N
          </div>
          <span className="font-bold text-2xl tracking-tight gradient-text">
            NexaSocial
          </span>
        </div>

        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-400">
            ✨ Next-Gen Social SaaS Platform
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Stream everywhere, publish smarter, scale faster.
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Manage all 7 major platforms — YouTube, Facebook, Instagram, LinkedIn,
            X, Twitch, and TikTok — in one centralized enterprise command center.
          </p>

          {/* Testimonial Quote */}
          <div className="p-6 rounded-2xl glass-panel space-y-3">
            <p className="text-sm text-foreground/90 italic">
              “NexaSocial transformed our broadcasting workflow. We stream to 5
              platforms simultaneously with zero latency.”
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-linear-to-tr from-amber-400 to-pink-500 flex items-center justify-center font-bold text-xs text-black">
                AK
              </div>
              <div>
                <p className="text-xs font-semibold">Alex Chen</p>
                <p className="text-[11px] text-muted-foreground">
                  Head of Live Production, MediaCorp
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 NexaSocial. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Right Form Column */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        {/* Mobile Header Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/25">
            N
          </div>
          <span className="font-bold text-2xl tracking-tight gradient-text">
            NexaSocial
          </span>
        </div>

        <div className="w-full max-w-md space-y-8">{children}</div>
      </div>
    </div>
  );
}
