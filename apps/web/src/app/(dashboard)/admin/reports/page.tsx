'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportDateRange } from '@/components/admin/reports/report-date-range';
import { UsersReport } from '@/components/admin/reports/views/users-report';
import { WorkspacesReport } from '@/components/admin/reports/views/workspaces-report';
import { SubscriptionsReport } from '@/components/admin/reports/views/subscriptions-report';
import { RevenueReport } from '@/components/admin/reports/views/revenue-report';
import { PaymentsReport } from '@/components/admin/reports/views/payments-report';
import { LiveStreamsReport } from '@/components/admin/reports/views/live-streams-report';
import { SocialPlatformsReport } from '@/components/admin/reports/views/social-platforms-report';
import { DateRange } from '@/components/admin/reports/report-date-range';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date()),
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Reports</h2>
          <p className="text-muted-foreground text-gray-400">
            Platform-wide analytics and operational reports.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ReportDateRange date={date} setDate={setDate} />
        </div>
      </div>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="live-streams">Live Streams</TabsTrigger>
            <TabsTrigger value="social-platforms">Social Platforms</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-4">
          <UsersReport dateRange={date} />
        </TabsContent>
        <TabsContent value="workspaces" className="space-y-4">
          <WorkspacesReport dateRange={date} />
        </TabsContent>
        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionsReport dateRange={date} />
        </TabsContent>
        <TabsContent value="revenue" className="space-y-4">
          <RevenueReport dateRange={date} />
        </TabsContent>
        <TabsContent value="payments" className="space-y-4">
          <PaymentsReport dateRange={date} />
        </TabsContent>
        <TabsContent value="live-streams" className="space-y-4">
          <LiveStreamsReport dateRange={date} />
        </TabsContent>
        <TabsContent value="social-platforms" className="space-y-4">
          <SocialPlatformsReport dateRange={date} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
