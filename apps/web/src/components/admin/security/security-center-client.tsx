'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecuritySummaryCards } from './security-summary-cards';
import { AdminLoginsTable } from './admin-logins-table';
import { FailedLoginsTable } from './failed-logins-table';
import { ActiveSessionsTable } from './active-sessions-table';
import { SuspiciousActivityTable } from './suspicious-activity-table';
import { PrivilegedActionsTable } from './privileged-actions-table';
import { SecurityEventsTable } from './security-events-table';

export function SecurityCenterClient() {
  return (
    <div className="space-y-6">
      <SecuritySummaryCards />

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="active-sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="failed-logins">Failed Logins</TabsTrigger>
          <TabsTrigger value="admin-logins">Admin Logins</TabsTrigger>
          <TabsTrigger value="suspicious">Suspicious Activity</TabsTrigger>
          <TabsTrigger value="privileged">Privileged Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <SecurityEventsTable />
        </TabsContent>

        <TabsContent value="active-sessions">
          <ActiveSessionsTable />
        </TabsContent>

        <TabsContent value="failed-logins">
          <FailedLoginsTable />
        </TabsContent>

        <TabsContent value="admin-logins">
          <AdminLoginsTable />
        </TabsContent>

        <TabsContent value="suspicious">
          <SuspiciousActivityTable />
        </TabsContent>

        <TabsContent value="privileged">
          <PrivilegedActionsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
