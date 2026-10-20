'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Calendar,
  BarChart3,
  Users,
  CheckCircle2,
  ChevronRight,
  Zap,
  Layers,
  Bot,
  LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TrackStep {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  accentBg: string;
  highlights: string[];
  previewContent: {
    heading: string;
    metricLabel: string;
    metricVal: string;
    statusText: string;
    tags: string[];
  };
}

const steps: TrackStep[] = [
  {
    id: 'ai-generation',
    stepNumber: '01',
    title: 'AI Scripting & Studio Generation',
    subtitle: 'From prompt to polished multi-format social content in seconds',
    description:
      'Engineered for modern creators. Generate platform-optimized captions, hashtag clusters, thumbnail prompts, and broadcast scripts instantly.',
    icon: Bot,
    color: 'from-violet-500 to-purple-500',
    accentBg: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
    highlights: [
      'Multi-model LLM generation fine-tuned for viral hooks',
      'Automatic caption translation into 30+ languages',
      'One-click format adaptation (Shorts, Reels, Posts, Threads)',
    ],
    previewContent: {
      heading: 'AI Post Generator Engine',
      metricLabel: 'Script Generation Speed',
      metricVal: '0.8s',
      statusText: 'Optimized for Instagram Reels & YouTube Shorts',
      tags: ['GPT-4o Vision', 'Viral Hook Score: 98/100', 'Auto Hashtags'],
    },
  },
  {
    id: 'rtmp-streaming',
    stepNumber: '02',
    title: '1080p60 Multi-Destination Live Stream',
    subtitle: 'One RTMP stream ingestion broadcast seamlessly to 4+ networks',
    description:
      'Eliminate bandwidth constraints. Send a single stream from OBS, vMix, or mobile and our cloud relays to YouTube, Facebook, Instagram, and X simultaneously.',
    icon: Radio,
    color: 'from-indigo-500 to-cyan-500',
    accentBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    highlights: [
      'Sub-15ms edge relay latency with failover protection',
      'Dynamic stream resolution overlay & chat unification',
      'Integrated DVR cloud recording & instant clipping',
    ],
    previewContent: {
      heading: 'RTMP Ingestion Relay Engine',
      metricLabel: 'Active Destination Bitrate',
      metricVal: '6,000 Kbps',
      statusText: '4/4 Edge Nodes Healthy • Zero Dropped Frames',
      tags: ['OBS/vMix Support', '1080p 60fps', 'Cloud DVR Auto-Save'],
    },
  },
  {
    id: 'smart-scheduling',
    stepNumber: '03',
    title: 'Smart Queue & Timezone Scheduler',
    subtitle: 'Publish automatically when your audience is most active',
    description:
      'Never miss peak engagement hours. Drag and drop posts onto an interactive calendar matrix with AI best-time recommendations.',
    icon: Calendar,
    color: 'from-cyan-500 to-emerald-500',
    accentBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    highlights: [
      'Cross-timezone predictive audience heatmaps',
      'Automated recurring post recycling & queue buffers',
      'Bulk CSV/API upload for monthly content campaigns',
    ],
    previewContent: {
      heading: 'AI Peak Time Dispatcher',
      metricLabel: 'Scheduled Posts Active',
      metricVal: '148 Posts',
      statusText: 'Next dispatch in 12 mins to Instagram & X',
      tags: ['Auto Timezone Shift', 'Drag & Drop Matrix', 'Bulk Import'],
    },
  },
  {
    id: 'unified-analytics',
    stepNumber: '04',
    title: 'Unified Real-Time Cross-Channel Deck',
    subtitle: 'Consolidate impressions, engagement, & audience growth',
    description:
      'Say goodbye to opening 10 separate analytics tabs. Track holistic reach, follower growth curves, and revenue conversions in one live dashboard.',
    icon: BarChart3,
    color: 'from-amber-500 to-rose-500',
    accentBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    highlights: [
      'Live subscriber & follower tally webhooks',
      'Sentiment analysis across all comment streams',
      'Exportable PDF & CSV executive reports for clients',
    ],
    previewContent: {
      heading: 'Unified Metrics Aggregator',
      metricLabel: '30-Day Combined Reach',
      metricVal: '4.8M',
      statusText: '+34.2% Growth vs Last Month across 7 Channels',
      tags: ['Real-Time Pings', 'Sentiment AI', 'Client PDF Reports'],
    },
  },
  {
    id: 'team-collaboration',
    stepNumber: '05',
    title: 'Enterprise Team Approval & Governance',
    subtitle: 'Scale content production without risking brand reputation',
    description:
      'Assign roles, set approval gates, manage brand asset vaults, and maintain audit logs for agencies, marketing teams, and enterprises.',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    accentBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    highlights: [
      'Multi-tier permissions (Admin, Editor, Reviewer, Client)',
      'Granular change logs & version history rollback',
      'Shared cloud brand asset library & color palette tokens',
    ],
    previewContent: {
      heading: 'Role-Based Workflow Engine',
      metricLabel: 'Pending Client Approvals',
      metricVal: '3 Campaigns',
      statusText: 'All assets passed compliance & brand checks',
      tags: ['Multi-Tenant Workspace', 'Audit Trails', 'Brand Lock'],
    },
  },
];

export function LandingJourneyTrack() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = steps[activeStepIndex];

  return (
    <section id="pipeline" className="py-16 sm:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-xs font-semibold tracking-wide backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 mr-1.5 inline text-cyan-400" />
            End-to-End Content Architecture
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            One platform for every leg of your{' '}
            <span className="gradient-text">content journey.</span>
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            From initial AI drafting to multi-destination live streaming and post-broadcast analytics, NexaSocial acts as your single operational operator.
          </p>
        </div>

        {/* Step Navigation Pill Track (Horizontal Scroll on Mobile) */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 scrollbar-none snap-x">
          {steps.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const IconComponent = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepIndex(idx)}
                className={`snap-start shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400/50 shadow-lg shadow-violet-500/25 scale-[1.02]'
                    : 'bg-card/40 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <span className="font-mono opacity-60 text-[10px]">{step.stepNumber}</span>
                <IconComponent className="w-4 h-4" />
                <span className="whitespace-nowrap">{step.title.split('&')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Display Card Box (Inspired by United Carriers Interactive Card) */}
        <div className="relative rounded-3xl bg-card/60 border border-white/10 p-6 sm:p-10 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -left-24 -top-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Stage Specs */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-black font-mono gradient-text">
                    {activeStep.stepNumber}
                  </span>
                  <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${activeStep.accentBg}`}>
                    Stage {activeStep.stepNumber} Operational
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {activeStep.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-violet-400">
                    {activeStep.subtitle}
                  </p>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {activeStep.description}
                </p>

                <div className="space-y-2.5 pt-2">
                  {activeStep.highlights.map((item, index) => (
                    <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Button
                    asChild
                    className="h-11 px-6 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 hover:scale-105 transition-all"
                  >
                    <a href="#demo" className="flex items-center gap-2">
                      <span>Explore Stage Demo</span>
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Right Column: Live Telemetry Preview Card */}
              <div className="lg:col-span-6">
                <div className="rounded-2xl bg-black/40 border border-white/10 p-6 space-y-6 shadow-inner relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {activeStep.previewContent.heading}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2.5 py-1 rounded-md">
                      ACTIVE RELAY
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-[11px] font-mono text-muted-foreground uppercase">
                        {activeStep.previewContent.metricLabel}
                      </span>
                      <p className="text-2xl sm:text-3xl font-black font-mono text-foreground gradient-text">
                        {activeStep.previewContent.metricVal}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-center space-y-1">
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Telemetry Status
                      </span>
                      <p className="text-xs font-medium text-muted-foreground line-clamp-2">
                        {activeStep.previewContent.statusText}
                      </p>
                    </div>
                  </div>

                  {/* Feature Badges Grid */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {activeStep.previewContent.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-3 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>

                  {/* Interactive Waveform / Progress bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
                      <span>Pipeline Optimization Rate</span>
                      <span className="text-cyan-400">99.8% Efficiency</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '92%' }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
