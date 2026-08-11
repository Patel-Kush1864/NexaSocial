'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Radio, Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Journey Pipeline', href: '#pipeline' },
    { label: 'Live Studio', href: '#demo' },
    { label: 'Platforms', href: '#platforms' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Brand Logo & Live Telemetry Badge */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform overflow-hidden">
            <span className="relative z-10">N</span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-foreground flex items-center gap-1.5">
              NexaSocial
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              Live Edge • v2.4
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links with United Carriers hover-un style */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover-un text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex text-xs font-semibold hover:bg-violet-500/10">
            <Link href="/login">Sign In</Link>
          </Button>

          <Button
            asChild
            className="h-10 text-xs font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 shadow-md shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Link href="/register" className="flex items-center gap-1.5">
              <span>Start Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-violet-500/10 transition-colors focus:outline-none"
            aria-label="Toggle Mobile Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden border-t border-border/40 bg-background/95 backdrop-blur-2xl px-6 py-6 space-y-4"
          >
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-muted-foreground hover:text-foreground hover:pl-2 transition-all flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 text-violet-400 opacity-50" />
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-border/40 flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full justify-center text-xs font-semibold">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign In to Dashboard
                </Link>
              </Button>
              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-muted-foreground font-mono">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>All 7 Platform APIs Operational</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

