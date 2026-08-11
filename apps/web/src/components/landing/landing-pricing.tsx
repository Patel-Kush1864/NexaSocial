'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = [
  {
    name: 'Starter',
    tagline: 'Ideal for solo creators & streamers starting multi-broadcasting',
    monthlyPrice: 29,
    annualPrice: 24,
    popular: false,
    badge: 'Creator Tier',
    features: [
      'Up to 3 Destination Platforms',
      '1080p60 Stream Resolution',
      'Unified Social Inbox',
      'Basic Performance Analytics',
      '1 Workspace Seat',
      '50GB Video Cloud Storage',
      'Standard Email Support',
    ],
  },
  {
    name: 'Pro Studio',
    tagline: 'Best for professional creators, agencies & growth media teams',
    monthlyPrice: 79,
    annualPrice: 63,
    popular: true,
    badge: 'Recommended',
    features: [
      'Unlimited Destination Platforms',
      '1080p60 Ultra-Low Latency Ingest',
      'AI Post & Script Copilot',
      'Cross-Channel Deep Analytics',
      '5 Workspace Seats with Role Controls',
      '500GB Video Cloud Storage',
      'Custom Watermarks & Overlays',
      'Priority 24/7 Support',
    ],
  },
  {
    name: 'Enterprise Network',
    tagline: 'For broadcasting networks, corporate brands & enterprise teams',
    monthlyPrice: 199,
    annualPrice: 159,
    popular: false,
    badge: 'Enterprise SLA',
    features: [
      'Unlimited Destinations + Custom SRT',
      '4K Broadcast Quality Ingest',
      'Unlimited Multi-Tenant Workspaces',
      'Dedicated Account Manager & SLA',
      'Unlimited Workspace Seats',
      '2TB Cloud Storage & Archiving',
      'Custom SSO & SAML Auth',
      'White-label Streaming Studio',
    ],
  },
];

export function LandingPricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-16 sm:py-24 space-y-12 relative z-10 scroll-mt-24">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="outline" className="px-4 py-1.5 text-xs border-violet-500/30 text-violet-300 bg-violet-500/10">
          <Zap className="w-3.5 h-3.5 mr-1.5 inline text-amber-400" />
          Transparent & Scalable Pricing
        </Badge>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Flexible plans for <span className="gradient-text">every broadcaster</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Start with a 14-day free trial. No credit card required. Upgrade or downgrade anytime with instant prorated billing.
        </p>

        {/* Annual / Monthly Billing Switcher Toggle */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className={`text-xs font-bold transition-colors ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly Billing
          </span>

          <button
            onClick={() => setAnnual(!annual)}
            className="w-16 h-8 rounded-full bg-violet-600/20 p-1 border border-violet-500/40 relative transition-colors focus:outline-none"
            aria-label="Toggle Annual Billing"
          >
            <motion.div
              animate={{ x: annual ? 32 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 shadow-md flex items-center justify-center text-[10px] font-black text-white"
            >
              %
            </motion.div>
          </button>

          <span className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annual Billing
            <Badge className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-mono">
              Save 20%
            </Badge>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
        {PLANS.map((plan, i) => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`p-8 rounded-3xl glass-card relative flex flex-col justify-between space-y-6 border transition-all duration-300 ${
                plan.popular
                  ? 'border-violet-500 shadow-2xl shadow-violet-500/25 scale-[1.03] bg-card/95 z-20'
                  : 'border-white/10 hover:border-violet-500/40 z-10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white text-[10px] uppercase font-mono font-black tracking-widest px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>MOST POPULAR CHOICE</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black tracking-tight">{plan.name}</h3>
                  <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-muted-foreground">
                    {plan.badge}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{plan.tagline}</p>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl sm:text-5xl font-black font-mono gradient-text">${price}</span>
                  <span className="text-xs text-muted-foreground font-mono">/ mo</span>
                  {annual && <span className="text-[10px] text-muted-foreground font-mono ml-1">(billed annually)</span>}
                </div>

                <div className="space-y-2.5 pt-6 border-t border-white/10">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs font-medium text-foreground/90">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  asChild
                  className={`w-full h-12 text-xs font-extrabold rounded-xl ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 shadow-xl shadow-violet-500/30 hover:scale-[1.02] transition-all'
                      : 'bg-white/10 text-foreground hover:bg-violet-500/20 transition-all'
                  }`}
                >
                  <Link href="/register" className="flex items-center justify-center gap-2">
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>

                <p className="text-[11px] text-center text-muted-foreground font-mono">
                  Instant Access • Zero Contract Lock
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

