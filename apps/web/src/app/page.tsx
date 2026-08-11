'use client';

import { LandingBackgroundAnimation } from '@/components/landing/landing-background-animation';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingHero } from '@/components/landing/landing-hero';
import { LandingJourneyTrack } from '@/components/landing/landing-journey-track';
import { LandingStudioPreview } from '@/components/landing/landing-studio-preview';
import { LandingPlatforms } from '@/components/landing/landing-platforms';
import { LandingFeatures } from '@/components/landing/landing-features';
import { LandingPricing } from '@/components/landing/landing-pricing';
import { LandingFAQ } from '@/components/landing/landing-faq';
import { LandingCTA } from '@/components/landing/landing-cta';
import { LandingFooter } from '@/components/landing/landing-footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden selection:bg-violet-500/20 selection:text-violet-300 font-sans">
      {/* Dynamic Scroll-Driven Project Background Animations */}
      <LandingBackgroundAnimation />

      {/* Header Bar */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-16 sm:space-y-24 relative z-10 w-full">
        <LandingHero />
        <LandingJourneyTrack />
        <LandingStudioPreview />
        <LandingPlatforms />
        <LandingFeatures />
        <LandingPricing />
        <LandingFAQ />
        <LandingCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}


