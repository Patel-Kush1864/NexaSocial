'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  usePlatformUserDetails, 
  useUserWorkspaces,
  useUserSubscriptions,
  useUserPayments,
  useUserSocialAccounts,
  useUserStreams,
  useUserActivity,
  useAdminUsers
} from '@/hooks/use-admin';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ChangeRoleDialog } from '@/components/users';
import {
  UserProfileHeader,
  OverviewTab,
  WorkspacesTab,
  SubscriptionsTab,
  PaymentsTab,
  SocialAccountsTab,
  LiveStreamsTab,
  ActivityTab
} from '@/components/users/profile';
import { toast } from 'sonner';

type TabType = 'overview' | 'workspaces' | 'subscriptions' | 'payments' | 'social' | 'streams' | 'activity';

const TABS: { id: TabType; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'payments', label: 'Payments' },
  { id: 'social', label: 'Social Accounts' },
  { id: 'streams', label: 'Live Streams' },
  { id: 'activity', label: 'Activity' },
];

export default function UserDetailsPage() {
  const { id } = useParams() as { id: string };
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('platform.users.manage');

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const { data: user, isLoading: isUserLoading } = usePlatformUserDetails(id);
  
  // Data for tabs
  const workspacesQuery = useUserWorkspaces(id);
  const subscriptionsQuery = useUserSubscriptions(id);
  const paymentsQuery = useUserPayments(id);
  const socialAccountsQuery = useUserSocialAccounts(id);
  const streamsQuery = useUserStreams(id);
  const activityQuery = useUserActivity(id);

  // Mutations
  const { updateStatus, updateRole } = useAdminUsers();

  if (isUserLoading) {
    return <LoadingSpinner size="lg" label="Loading user details..." />;
  }

  if (!user) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold mb-4">User not found</h2>
        <p className="text-muted-foreground">The requested user does not exist or is no longer available.</p>
      </div>
    );
  }

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus({ id, status });
      toast.success(`User successfully ${status.toLowerCase()}`);
    } catch (e) {
      toast.error(`Failed to update status to ${status}`);
    }
  };

  const handleRoleChange = async (roleId: string) => {
    try {
      await updateRole({ id, roleId });
      toast.success('User role updated successfully');
      setRoleDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      <UserProfileHeader 
        user={user}
        canManage={canManage}
        onActivate={() => handleStatusChange('ACTIVE')}
        onSuspend={() => handleStatusChange('SUSPENDED')}
        onDeactivate={() => handleStatusChange('DEACTIVATED')}
        onChangeRole={() => setRoleDialogOpen(true)}
      />

      <div className="border-b border-border/50">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="py-4">
        {activeTab === 'overview' && (
          <OverviewTab 
            user={user}
            workspacesTotal={workspacesQuery.data?.total || 0}
            paymentsTotal={paymentsQuery.data?.total || 0}
            streamsTotal={streamsQuery.data?.total || 0}
            socialAccountsTotal={socialAccountsQuery.data?.total || 0}
          />
        )}
        {activeTab === 'workspaces' && <WorkspacesTab data={workspacesQuery.data} isLoading={workspacesQuery.isLoading} />}
        {activeTab === 'subscriptions' && <SubscriptionsTab data={subscriptionsQuery.data} isLoading={subscriptionsQuery.isLoading} />}
        {activeTab === 'payments' && <PaymentsTab data={paymentsQuery.data} isLoading={paymentsQuery.isLoading} />}
        {activeTab === 'social' && <SocialAccountsTab data={socialAccountsQuery.data} isLoading={socialAccountsQuery.isLoading} />}
        {activeTab === 'streams' && <LiveStreamsTab data={streamsQuery.data} isLoading={streamsQuery.isLoading} />}
        {activeTab === 'activity' && <ActivityTab data={activityQuery.data} isLoading={activityQuery.isLoading} />}
      </div>

      {canManage && (
        <ChangeRoleDialog
          isOpen={roleDialogOpen}
          onClose={() => setRoleDialogOpen(false)}
          currentRoleId={user.role?.id || ''}
          onConfirm={handleRoleChange}
        />
      )}
    </div>
  );
}
