'use client';

import { Card, CardContent } from '@/components/ui/card';

export function DashboardKpiSkeleton() {
  return (
    <Card className="overflow-hidden border-none shadow-md bg-white/50 dark:bg-zinc-900/50">
      <CardContent className="p-6">
        <div className="flex justify-between items-start animate-pulse">
          <div className="space-y-3">
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </CardContent>
    </Card>
  );
}
