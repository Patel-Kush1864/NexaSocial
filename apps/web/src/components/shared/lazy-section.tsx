'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { DashboardChartSkeleton } from '@/components/dashboard/skeletons/dashboard-chart-skeleton';

interface LazySectionProps {
  children: React.ReactNode;
  minHeight?: number;
  skeleton?: React.ReactNode;
}

export function LazySection({ children, minHeight = 400, skeleton }: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "200px 0px" });

  return (
    <div ref={ref} style={{ minHeight }} className="w-full">
      {isInView ? children : (skeleton || <DashboardChartSkeleton />)}
    </div>
  );
}
