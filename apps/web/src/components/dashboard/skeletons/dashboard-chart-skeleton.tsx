'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface DashboardChartSkeletonProps {
  className?: string;
}

export function DashboardChartSkeleton({ className }: DashboardChartSkeletonProps) {
  return (
    <div className={`h-[300px] w-full pt-4 flex flex-col gap-4 ${className || ''}`}>
      {/* Chart Grid Lines */}
      <div className="flex-1 flex flex-col justify-between py-4 opacity-20">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full h-px bg-muted-foreground/30 border-dashed" />
        ))}
      </div>
      
      {/* Pseudo-chart Area/Bars */}
      <div className="absolute inset-0 pt-8 pb-10 px-4 flex items-end justify-between opacity-50">
        {[...Array(7)].map((_, i) => {
          // generate varied heights for skeleton columns
          const heights = ['h-[40%]', 'h-[65%]', 'h-[45%]', 'h-[80%]', 'h-[55%]', 'h-[90%]', 'h-[70%]'];
          return (
            <div key={i} className="flex flex-col items-center gap-2 w-1/12">
              <Skeleton className={`w-full ${heights[i]} rounded-sm`} />
              <Skeleton className="h-3 w-8" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
