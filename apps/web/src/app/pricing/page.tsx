'use client';

import { LandingBackgroundAnimation } from '@/components/landing/landing-background-animation';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingFooter } from '@/components/landing/landing-footer';
import { PricingPlans } from '@/components/pricing/pricing-plans';

export default function PublicPricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden selection:bg-violet-500/20 selection:text-violet-300 font-sans">
      <LandingBackgroundAnimation />
      <LandingNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20 relative z-10 w-full">
        <PricingPlans isPublicView={true} showComparison={true} />
      </main>

      <LandingFooter />
    </div>
  );
}
