'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Streaming Tech', 'AI & Scheduling', 'Enterprise & Team', 'Billing'];

const FAQS = [
  {
    category: 'Streaming Tech',
    question: 'How does multi-destination live streaming work on NexaSocial?',
    answer:
      'NexaSocial receives a single 1080p high-bitrate RTMP video feed from your encoder (OBS Studio, vMix, Wirecast, Streamlabs, etc.) and duplicates the stream across all your connected social platforms simultaneously without consuming extra upload bandwidth on your local internet connection.',
  },
  {
    category: 'Streaming Tech',
    question: 'Which social platforms are supported out of the box?',
    answer:
      'We support YouTube Live, Instagram Live (via Live Producer), Facebook Live (Pages & Groups), X (Twitter Live), as well as custom RTMP and SRT server endpoints.',
  },
  {
    category: 'Streaming Tech',
    question: 'Is there a limit on how long I can live stream?',
    answer:
      'NexaSocial Pro and Enterprise plans allow unlimited broadcast hours with zero throttling or forced disconnects. Free trial accounts allow up to 20 broadcast hours during the 14-day trial period.',
  },
  {
    category: 'AI & Scheduling',
    question: 'How does the AI Post Generator format content for different channels?',
    answer:
      'Our fine-tuned LLM model reads your base topic or script and automatically generates platform-specific variations: engaging captions with hashtag stacks for Instagram, concise updates for X, and video description copy with timestamp markers for YouTube.',
  },
  {
    category: 'Enterprise & Team',
    question: 'Can I manage multiple clients or team members?',
    answer:
      'Yes! NexaSocial features multi-tenant workspace isolation. You can create separate workspaces for each client or team, assign role-based permissions (Admin, Editor, Viewer), and manage separate OAuth credentials securely.',
  },
  {
    category: 'Billing',
    question: 'Do I need a credit card to start the free trial?',
    answer:
      'No. You can sign up and start your 14-day trial instantly without entering any payment credentials. You only pay when you decide to upgrade.',
  },
];

export function LandingFAQ() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = selectedCategory === 'All'
    ? FAQS
    : FAQS.filter((item) => item.category === selectedCategory);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 space-y-10 relative z-10 scroll-mt-24 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="px-4 py-1.5 text-xs border-violet-500/30 text-violet-300 bg-violet-500/10">
          <HelpCircle className="w-3.5 h-3.5 mr-1.5 inline text-cyan-400" />
          Frequently Asked Questions
        </Badge>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Everything you need to <span className="gradient-text">know</span>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Clear answers about NexaSocial multi-broadcasting, AI post tools, and team plans.
        </p>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setOpenIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-500/30'
                  : 'bg-card/40 border-white/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion FAQ Items */}
      <div className="space-y-4 pt-2">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-2xl glass-card border transition-all duration-200 overflow-hidden ${
                isOpen ? 'border-violet-500/40 shadow-xl' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-foreground hover:text-violet-300 transition-colors gap-4"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-violet-400' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-4 bg-white/5 font-medium">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

