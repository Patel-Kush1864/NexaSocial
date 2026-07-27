'use client';

import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/cards/stat-card';
import { OverviewChart } from '@/components/charts/overview-chart';
import { PlatformChart } from '@/components/charts/platform-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Eye, MessageSquare, Share2, Download, Calendar } from 'lucide-react';

export function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Cross-Platform Analytics"
        description="Comprehensive engagement, audience growth, and reach statistics."
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 text-xs glass-panel">
              <Calendar className="w-3.5 h-3.5 mr-2" />
              Last 30 Days
            </Button>
            <Button size="sm" className="h-9 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold">
              <Download className="w-3.5 h-3.5 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Impressions"
          value="1.2M"
          change="+18.2%"
          isPositive={true}
          icon={Eye}
          gradient="from-blue-600 to-cyan-600"
        />
        <StatCard
          title="Net Followers Gained"
          value="+4,820"
          change="+8.4%"
          isPositive={true}
          icon={Users}
          gradient="from-violet-600 to-indigo-600"
        />
        <StatCard
          title="Comments & Messages"
          value="14,290"
          change="+24.1%"
          isPositive={true}
          icon={MessageSquare}
          gradient="from-pink-500 to-rose-600"
        />
        <StatCard
          title="Content Shares"
          value="3,840"
          change="+5.2%"
          isPositive={true}
          icon={Share2}
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Impressions & Reach Over Time</CardTitle>
            <CardDescription className="text-xs">
              Daily trend of total content views across all connected channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OverviewChart />
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Platform Engagement Share</CardTitle>
            <CardDescription className="text-xs">
              Percentage breakdown of user interactions by platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlatformChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AnalyticsPage;
