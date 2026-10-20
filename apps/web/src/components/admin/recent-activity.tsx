import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityRow } from './activity-row';
import { usePlatformActivity } from '@/hooks/use-activity';
import { Activity, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardActivitySkeleton } from '@/components/dashboard/skeletons/dashboard-activity-skeleton';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'USER', label: 'Users' },
  { id: 'WORKSPACE', label: 'Workspaces' },
  { id: 'PAYMENT', label: 'Payments' },
  { id: 'SUBSCRIPTION', label: 'Subscriptions' },
  { id: 'SOCIAL', label: 'Social' },
  { id: 'STREAM', label: 'Streams' },
];

export function RecentActivity() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  // Load initial dashboard limit (e.g. 5)
  const { data: activities, isLoading, isError, refetch, isFetching } = usePlatformActivity({
    category: activeCategory,
    page: 1,
    limit: 5
  });

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader className="pb-3 border-b border-border/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Platform Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Monitor the latest activity across NexaSocial.
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              disabled={isFetching || isLoading}
              className="h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/admin/activity">
              <Button variant="default" size="sm" className="h-8">
                View All
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pt-4 pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-md transition-colors ${
                activeCategory === cat.id
                  ? 'bg-foreground text-background'
                  : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isError ? (
          <ErrorState
            title="Error"
            message="Unable to load recent platform activity."
            onRetry={() => refetch()}
            className="border-0 shadow-none bg-transparent my-8"
          />
        ) : (isLoading && activities.length === 0) ? (
          <div className="p-4">
            <DashboardActivitySkeleton rows={5} />
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={activeCategory !== 'ALL' ? "No activity matches your filter" : "No recent platform activity"}
            description={activeCategory !== 'ALL' ? "Try selecting another category." : "Platform activity will appear here as users, workspaces, and events occur."}
            compact
            className="border-0 bg-transparent shadow-none"
          />
        ) : (
          <div className="flex flex-col">
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
