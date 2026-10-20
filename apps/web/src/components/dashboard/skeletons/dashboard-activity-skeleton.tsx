'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface DashboardActivitySkeletonProps {
  rows?: number;
}

export function DashboardActivitySkeleton({ rows = 5 }: DashboardActivitySkeletonProps) {
  return (
    <div className="space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-3 w-[40%]" />
          </div>
        </div>
      ))}
    </div>
  );
}
