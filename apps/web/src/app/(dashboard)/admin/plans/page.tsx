'use client';

import { useState } from 'react';
import { useAdminPlans } from '@/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AdminPlan } from '@/types';
import {
  PlansTable,
  PlanFilters,
  PlanModal,
  PlanPreviewModal,
  ConfirmStatusModal,
} from '@/components/plans';

export default function AdminPlansPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [billingCycle, setBillingCycle] = useState<string>('all');

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<AdminPlan | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusPlan, setStatusPlan] = useState<AdminPlan | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | null>(null);

  const {
    plansData,
    isLoading,
    createPlan,
    updatePlan,
    updatePlanStatus,
  } = useAdminPlans({
    page,
    limit,
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
    billingCycle: billingCycle !== 'all' ? billingCycle : undefined,
  });

  const plans = plansData?.data || [];
  const total = plansData?.total || 0;

  const totalActive = plans.filter((p) => p.status === 'ACTIVE').length;
  const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscriberCount || 0), 0);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditModal = (plan: AdminPlan) => {
    setEditingPlan(plan);
    setIsPlanModalOpen(true);
  };

  const handleOpenPreviewModal = (plan: AdminPlan) => {
    setPreviewPlan(plan);
    setIsPreviewModalOpen(true);
  };

  const handleSavePlan = async (data: Partial<AdminPlan>) => {
    try {
      if (editingPlan) {
        await updatePlan({ id: editingPlan.id, payload: data });
      } else {
        await createPlan(data);
      }
      setIsPlanModalOpen(false);
    } catch (err) {
      console.error('Failed to save plan:', err);
    }
  };

  const requestStatusChange = (plan: AdminPlan, newStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => {
    setStatusPlan(plan);
    setTargetStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (statusPlan && targetStatus) {
      try {
        await updatePlanStatus({ id: statusPlan.id, status: targetStatus });
        setIsStatusModalOpen(false);
      } catch (err) {
        console.error('Failed to change status:', err);
      }
    }
  };

  if (isLoading && !plans.length) {
    return <LoadingSpinner size="lg" label="Loading subscription plans..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Plan Management"
          description="Configure pricing tiers, limits, and monitor plan subscriptions."
          badge={`${total} Total Plans`}
        />
        <Button onClick={handleOpenCreateModal} className="bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Create New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Plans</h3>
          <p className="text-3xl font-extrabold text-white font-mono">{total}</p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Active Plans</h3>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">{totalActive}</p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 shadow-sm">
          <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Subscriptions</h3>
          <p className="text-3xl font-extrabold text-violet-400 font-mono">{totalSubscribers.toLocaleString()}</p>
        </div>
      </div>

      <PlanFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
      />

      <PlansTable
        plans={plans}
        onEdit={handleOpenEditModal}
        onPreview={handleOpenPreviewModal}
        onActivate={(id) => requestStatusChange(plans.find((p) => p.id === id)!, 'ACTIVE')}
        onDeactivate={(id) => requestStatusChange(plans.find((p) => p.id === id)!, 'INACTIVE')}
        onArchive={(plan) => requestStatusChange(plan, 'ARCHIVED')}
      />

      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        plan={editingPlan}
        onSave={handleSavePlan}
        isLoading={isLoading}
      />

      <PlanPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        plan={previewPlan}
      />

      <ConfirmStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleConfirmStatusChange}
        plan={statusPlan}
        targetStatus={targetStatus}
        isLoading={isLoading}
      />
    </div>
  );
}
