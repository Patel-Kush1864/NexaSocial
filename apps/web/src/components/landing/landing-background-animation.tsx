'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Radio, Activity, Zap, Wifi, Bot, Layers, CheckCircle2 } from 'lucide-react';

export function LandingBackgroundAnimation() {
  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    restDelta: 0.001,
  });

  // Parallax positions for floating mesh orbs
  const orb1Y = useTransform(smoothProgress, [0, 1], ['0%', '180%']);
  const orb1Scale = useTransform(smoothProgress, [0, 0.5, 1], [1, 1.4, 0.9]);

  const orb2Y = useTransform(smoothProgress, [0, 1], ['0%', '-120%']);
  const orb2X = useTransform(smoothProgress, [0, 0.5, 1], ['0px', '80px', '-40px']);

  const orb3Y = useTransform(smoothProgress, [0, 1], ['0%', '140%']);
  const orb3Scale = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1.3, 1.1]);

  // Parallax offsets for floating telemetry chips
  const chip1Y = useTransform(smoothProgress, [0, 1], [0, -320]);
  const chip2Y = useTransform(smoothProgress, [0, 1], [0, -480]);
  const chip3Y = useTransform(smoothProgress, [0, 1], [0, -240]);
  const chip4Y = useTransform(smoothProgress, [0, 1], [0, -360]);

  // Rotations on scroll
  const rotateGrid = useTransform(smoothProgress, [0, 1], [0, 12]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Top Scroll Progress Indicator Bar */}
      <motion.div
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 via-cyan-400 to-emerald-400 origin-left z-50 shadow-[0_0_12px_rgba(168,85,247,0.8)]"
      />

      {/* Cyber Grid Layer */}
      <motion.div
        style={{ rotate: rotateGrid }}
        className="absolute inset-0 bg-cyber-grid opacity-40 transition-opacity"
      />

      {/* Parallax Gradient Mesh Glow Orbs */}
      {/* Orb 1: Violet Top Glow */}
      <motion.div
        style={{ y: orb1Y, scale: orb1Scale }}
        className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[500px] rounded-full bg-gradient-to-b from-violet-600/25 via-indigo-600/15 to-transparent blur-[140px]"
      />

      {/* Orb 2: Cyan Middle Glow */}
      <motion.div
        style={{ y: orb2Y, x: orb2X }}
        className="absolute top-[40%] -left-[200px] w-[550px] h-[550px] rounded-full bg-cyan-600/15 blur-[120px]"
      />

      {/* Orb 3: Emerald Features Glow */}
      <motion.div
        style={{ y: orb3Y, scale: orb3Scale }}
        className="absolute top-[60%] -right-[200px] w-[600px] h-[600px] rounded-full bg-emerald-600/15 blur-[130px]"
      />

      {/* Orb 4: Amber Bottom Glow */}
      <motion.div className="absolute bottom-[5%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[110px] animate-pulse-glow" />

      {/* Vertical Signal Beam Relays */}
      <div className="absolute left-[8%] inset-y-0 w-px bg-gradient-to-b from-transparent via-violet-500/20 to-transparent hidden lg:block">
        <div className="w-full h-32 bg-gradient-to-b from-violet-400 to-cyan-400 animate-beam-flow shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
      </div>

      <div className="absolute right-[8%] inset-y-0 w-px bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent hidden lg:block">
        <div className="w-full h-32 bg-gradient-to-b from-cyan-400 to-emerald-400 animate-beam-flow shadow-[0_0_8px_rgba(6,182,212,0.8)]" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating Project Telemetry Chips (Responding to Scroll Depth) */}
      {/* Chip 1: Top Left RTMP */}
      <motion.div
        style={{ y: chip1Y }}
        className="hidden xl:flex absolute left-10 top-[25%] items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-violet-500/30 text-[11px] font-mono text-violet-300 backdrop-blur-xl shadow-2xl"
      >
        <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>RTMP Ingest: 1080p60 Active</span>
      </motion.div>

      {/* Chip 2: Top Right 7 Relays */}
      <motion.div
        style={{ y: chip2Y }}
        className="hidden xl:flex absolute right-12 top-[35%] items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 backdrop-blur-xl shadow-2xl"
      >
        <Activity className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
        <span>7 Platform Relays Synced</span>
      </motion.div>

      {/* Chip 3: Middle Left Sub-15ms Latency */}
      <motion.div
        style={{ y: chip3Y }}
        className="hidden xl:flex absolute left-14 top-[55%] items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-indigo-500/30 text-[11px] font-mono text-indigo-300 backdrop-blur-xl shadow-2xl"
      >
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span>Sub-15ms Global Edge Latency</span>
      </motion.div>

      {/* Chip 4: Bottom Right AI Copilot */}
      <motion.div
        style={{ y: chip4Y }}
        className="hidden xl:flex absolute right-14 top-[70%] items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 backdrop-blur-xl shadow-2xl"
      >
        <Bot className="w-3.5 h-3.5 text-purple-400" />
        <span>AI Hook Generator Standby</span>
      </motion.div>

      {/* Side Audio Equalizer Visualizer (Left Edge) */}
      <div className="hidden lg:flex fixed left-3 top-1/2 -translate-y-1/2 flex-col items-center gap-1.5 p-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
        <div className="text-[9px] font-mono text-violet-400 font-bold [writing-mode:vertical-lr] mb-1">
          LIVE AUDIO MASTER
        </div>
        <div className="flex items-end gap-1 h-12 w-4">
          <div className="w-1 rounded-full bg-violet-400 animate-eq-pulse-1" />
          <div className="w-1 rounded-full bg-indigo-400 animate-eq-pulse-2" />
          <div className="w-1 rounded-full bg-cyan-400 animate-eq-pulse-3" />
          <div className="w-1 rounded-full bg-emerald-400 animate-eq-pulse-4" />
        </div>
      </div>

      {/* Side Platform Status Stream (Right Edge) */}
      <div className="hidden lg:flex fixed right-3 top-1/2 -translate-y-1/2 flex-col items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md text-[10px] font-mono">
        <div className="text-[9px] font-mono text-cyan-400 font-bold [writing-mode:vertical-lr] mb-1">
          7 DESTINATIONS ONLINE
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <div className="w-2 h-2 rounded-full bg-rose-500" />
        <div className="w-2 h-2 rounded-full bg-indigo-500" />
      </div>
    </div>
  );
}
