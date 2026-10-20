'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, Activity, Share2, Play, HardDrive } from 'lucide-react';
import { 
  usePlatformWorkspaceDetails,
  useWorkspaceMembers,
  useWorkspaceSubscription,
  useWorkspaceUsage,
  useWorkspaceSocialAccounts,
  useWorkspaceStreams,
  useWorkspaceActivity,
  useAdminWorkspaces
} from '@/hooks/use-admin';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  WorkspaceProfileHeader,
  OverviewTab,
  MembersTab,
  SubscriptionTab,
  UsageTab,
  SocialAccountsTab,
  LiveStreamsTab,
  ActivityTab
} from '@/components/workspaces/profile';

export default function WorkspaceAdminDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { hasPermission } = useAuthStore();
  const { updateStatus } = useAdminWorkspaces();
  const canManage = hasPermission('platform.workspaces.manage');

  const { data: workspace, isLoading: isLoadingWorkspace, refetch } = usePlatformWorkspaceDetails(id);
  const [activeTab, setActiveTab] = useState('overview');

  const membersQuery = useWorkspaceMembers(id);
  const subscriptionQuery = useWorkspaceSubscription(id);
  const usageQuery = useWorkspaceUsage(id);
  const socialQuery = useWorkspaceSocialAccounts(id);
  const streamsQuery = useWorkspaceStreams(id);
  const activityQuery = useWorkspaceActivity(id);

  if (isLoadingWorkspace) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading workspace details..." />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Workspace Not Found</h2>
          <p className="text-muted-foreground">The workspace you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const handleUpdateStatus = async (status: string) => {
    try {
      await updateStatus({ id, status });
      refetch();
    } catch (error) {
      console.error('Failed to update workspace status:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'usage', label: 'Usage', icon: HardDrive },
    { id: 'social', label: 'Social Accounts', icon: Share2 },
    { id: 'streams', label: 'Live Streams', icon: Play },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <WorkspaceProfileHeader 
        workspace={workspace} 
        canManage={canManage}
        onActivate={() => handleUpdateStatus('ACTIVE')}
        onSuspend={() => handleUpdateStatus('SUSPENDED')}
        onArchive={() => handleUpdateStatus('ARCHIVED')}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-secondary/20 flex-wrap mb-6">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab workspace={workspace} />
        </TabsContent>
        <TabsContent value="members">
          <MembersTab data={membersQuery.data} isLoading={membersQuery.isLoading} />
        </TabsContent>
        <TabsContent value="subscription">
          <SubscriptionTab data={subscriptionQuery.data} isLoading={subscriptionQuery.isLoading} />
        </TabsContent>
        <TabsContent value="usage">
          <UsageTab data={usageQuery.data} isLoading={usageQuery.isLoading} />
        </TabsContent>
        <TabsContent value="social">
          <SocialAccountsTab data={socialQuery.data} isLoading={socialQuery.isLoading} />
        </TabsContent>
        <TabsContent value="streams">
          <LiveStreamsTab data={streamsQuery.data} isLoading={streamsQuery.isLoading} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab data={activityQuery.data} isLoading={activityQuery.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
