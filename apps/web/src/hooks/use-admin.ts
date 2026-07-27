'use client';

// ═══════════════════════════════════════════
// NexaSocial — Admin Hooks
// ═══════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => adminService.getDashboardSummary(),
  });
}

export function useAdminUsers(limit = 50, offset = 0) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users(limit, offset),
    queryFn: () => adminService.getUsers(limit, offset),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User status updated');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User deleted');
    },
  });

  return {
    data: usersQuery.data,
    isLoading: usersQuery.isLoading,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
  };
}

export function useAdminWorkspaces(limit = 50, offset = 0) {
  const queryClient = useQueryClient();

  const workspacesQuery = useQuery({
    queryKey: queryKeys.admin.workspaces(limit, offset),
    queryFn: () => adminService.getWorkspaces(limit, offset),
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
      toast.success('Workspace deleted');
    },
  });

  return {
    data: workspacesQuery.data,
    isLoading: workspacesQuery.isLoading,
    deleteWorkspace: deleteWorkspaceMutation.mutateAsync,
  };
}

export function useAdminPlans() {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: queryKeys.admin.plans,
    queryFn: () => adminService.getPlans(),
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: Parameters<typeof adminService.createPlan>[0]) =>
      adminService.createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.plans });
      toast.success('Plan created');
    },
  });

  return {
    plans: plansQuery.data || [],
    isLoading: plansQuery.isLoading,
    createPlan: createPlanMutation.mutateAsync,
  };
}

export function useAdminPayments(limit = 50, offset = 0) {
  return useQuery({
    queryKey: queryKeys.admin.payments(limit, offset),
    queryFn: () => adminService.getPayments(limit, offset),
  });
}
