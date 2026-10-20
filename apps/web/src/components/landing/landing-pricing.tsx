'use client';

import { PricingPlans } from '@/components/pricing/pricing-plans';

export function LandingPricing() {
  return (
    <section id="pricing" className="py-12 sm:py-20 relative z-10 scroll-mt-24">
      <PricingPlans isPublicView={true} showComparison={true} />
    </section>
  );
}
