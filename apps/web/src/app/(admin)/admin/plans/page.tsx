'use client';

import { useAdminPlans } from '@/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { PlanCard } from '@/components/cards/plan-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function AdminPlansPage() {
  const { plans, isLoading } = useAdminPlans();

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading subscription plans..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="SaaS Subscription Plans"
        description="Configure pricing tiers, workspace limits, and feature availability."
        badge={`${plans.length || 3} Tiers`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PlanCard
          name="Starter"
          tier="STARTER"
          price={19}
          interval="MONTHLY"
          features={[
            '3 Connected Accounts',
            '720p Streaming',
            '1 Workspace',
            '2 Team Members',
          ]}
        />
        <PlanCard
          name="Pro"
          tier="PRO"
          price={49}
          interval="MONTHLY"
          features={[
            '15 Connected Accounts',
            '1080p Multi-Stream',
            '5 Workspaces',
            '10 Team Members',
            'Real-Time Chat',
          ]}
        />
        <PlanCard
          name="Enterprise"
          tier="ENTERPRISE"
          price={199}
          interval="MONTHLY"
          features={[
            'Unlimited Social Channels',
            '4K UHD Streaming',
            'Unlimited Workspaces',
            'Dedicated Account Manager',
          ]}
        />
      </div>
    </div>
  );
}
