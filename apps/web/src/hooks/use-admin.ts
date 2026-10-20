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

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  subscription?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: unknown;
}

export function useAdminUsers(params: UserQueryParams = { limit: 20, page: 1 }) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getPlatformUsers(params),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updatePlatformUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User status updated successfully');
    },
    onError: () => toast.error('Failed to update user status'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
      adminService.updatePlatformUserRole(id, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated successfully');
    },
    onError: () => toast.error('Failed to update user role'),
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
    updateRole: updateRoleMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
  };
}

// User Details Hooks
export function usePlatformUserDetails(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'details'],
    queryFn: () => adminService.getPlatformUserById(id),
    enabled: !!id,
  });
}

export function useUserWorkspaces(id: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'workspaces', limit, offset],
    queryFn: () => adminService.getUserWorkspaces(id, limit, offset),
    enabled: !!id,
  });
}

export function useUserSubscriptions(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'subscriptions'],
    queryFn: () => adminService.getUserSubscriptions(id),
    enabled: !!id,
  });
}

// ── Platform Payments ──────────────────────────
export function usePlatformPayments(params?: any) {
  return useQuery({
    queryKey: ['admin', 'platform-payments', params],
    queryFn: () => adminService.getPlatformPayments(params),
    placeholderData: (previousData) => previousData,
  });
}

export function usePlatformPaymentStatistics(params?: any) {
  return useQuery({
    queryKey: ['admin', 'platform-payments-statistics', params],
    queryFn: () => adminService.getPlatformPaymentStatistics(params),
  });
}

export function usePlatformPaymentDetails(id: string) {
  return useQuery({
    queryKey: ['admin', 'platform-payment', id],
    queryFn: () => adminService.getPlatformPaymentById(id),
    enabled: !!id,
  });
}

export function useExportPlatformPayments() {
  return useMutation({
    mutationFn: (params?: any) => adminService.exportPlatformPayments(params),
  });
}

export function useUserPayments(id: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'payments', limit, offset],
    queryFn: () => adminService.getUserPayments(id, limit, offset),
    enabled: !!id,
  });
}

export function useUserSocialAccounts(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'social-accounts'],
    queryFn: () => adminService.getUserSocialAccounts(id),
    enabled: !!id,
  });
}

export function useUserStreams(id: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'streams', limit, offset],
    queryFn: () => adminService.getUserStreams(id, limit, offset),
    enabled: !!id,
  });
}

export function useUserActivity(id: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['admin', 'users', id, 'activity', limit, offset],
    queryFn: () => adminService.getUserActivity(id, limit, offset),
    enabled: !!id,
  });
}

// --- Workspaces ---
export interface WorkspaceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  plan?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: unknown;
}

export function useAdminWorkspaces(params: WorkspaceQueryParams = { limit: 20, page: 1 }) {
  const queryClient = useQueryClient();

  const workspacesQuery = useQuery({
    queryKey: ['admin', 'workspaces', params],
    queryFn: () => adminService.getWorkspaces(params),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      adminService.updateWorkspaceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
    },
  });

  const deleteWorkspace = useMutation({
    mutationFn: (id: string) => adminService.deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspaces'] });
      toast.success('Workspace deleted successfully');
    },
    onError: () => toast.error('Failed to delete workspace'),
  });

  return {
    data: workspacesQuery.data,
    isLoading: workspacesQuery.isLoading,
    updateStatus: updateStatus.mutateAsync,
    deleteWorkspace: deleteWorkspace.mutate,
  };
}

export function usePlatformWorkspaceDetails(id: string) {
  return useQuery({
    queryKey: ['admin', 'workspaces', id],
    queryFn: () => adminService.getWorkspaceById(id),
    enabled: !!id,
  });
}

export function useWorkspaceMembers(id: string, limit = 20, page = 1) {
  return useQuery({
    queryKey: ['admin', 'workspaces', id, 'members', { limit, page }],
    queryFn: () => adminService.getWorkspaceMembers(id, limit, (page - 1) * limit),
    enabled: !!id,
  });
}

export function useWorkspaceSubscription(id: string) {
  return useQuery({
    queryKey: ['admin', 'workspaces', id, 'subscription'],
    queryFn: () => adminService.getWorkspaceSubscription(id),
    enabled: !!id,
  });
}

export function useWorkspaceUsage(id: string) {
  return useQuery({
    queryKey: ['admin', 'workspaces', id, 'usage'],
    queryFn: () => adminService.getWorkspaceUsage(id),
    enabled: !!id,
  });
}

export function useWorkspaceSocialAccounts(id: string, limit = 20, page = 1) {
  return useQuery({
    queryKey: ['admin', 'workspaces', id, 'social-accounts', { limit, page }],
    queryFn: () => adminService.getWorkspaceSocialAccounts(id, limit, (page - 1) * limit),
    enabled: !!id,
  });
}

export function useWorkspaceStreams(id: string, limit = 20, page = 1) {
  return useQuery({
    queryKey: ['admin', 'workspaces', id, 'streams', { limit, page }],
    queryFn: () => adminService.getWorkspaceStreams(id, limit, (page - 1) * limit),
    enabled: !!id,
  });
}

export function useWorkspaceActivity(id: string, limit = 20, page = 1) {
  return useQuery({
    queryKey: ['admin', 'workspaces', id, 'activity', { limit, page }],
    queryFn: () => adminService.getWorkspaceActivity(id, limit, (page - 1) * limit),
    enabled: !!id,
  });
}

export function useAdminPlans(params?: { search?: string; status?: string; billingCycle?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: [...queryKeys.admin.plans, params],
    queryFn: () => adminService.getPlans(params),
  });

  const createPlanMutation = useMutation({
    mutationFn: (payload: Parameters<typeof adminService.createPlan>[0]) =>
      adminService.createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.plans });
      toast.success('Plan created');
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminService.updatePlan>[1] }) =>
      adminService.updatePlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.plans });
      toast.success('Plan updated');
    },
  });

  const updatePlanStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updatePlanStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.plans });
      toast.success('Plan status updated');
    },
  });

  return {
    plansData: plansQuery.data,
    isLoading: plansQuery.isLoading,
    createPlan: createPlanMutation.mutateAsync,
    updatePlan: updatePlanMutation.mutateAsync,
    updatePlanStatus: updatePlanStatusMutation.mutateAsync,
  };
}



// --- Subscriptions ---
export interface SubscriptionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  planId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: unknown;
}

export function usePlatformSubscriptions(params: SubscriptionQueryParams = { limit: 20, page: 1 }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'subscriptions', params],
    queryFn: () => adminService.getPlatformSubscriptions(params),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminService.cancelPlatformSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      toast.success('Subscription cancelled successfully');
    },
    onError: () => toast.error('Failed to cancel subscription'),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    cancelSubscription: cancelMutation.mutateAsync,
  };
}

export function useSubscriptionStatistics() {
  return useQuery({
    queryKey: ['admin', 'subscriptions', 'statistics'],
    queryFn: () => adminService.getPlatformSubscriptionStatistics(),
  });
}

export function useSubscriptionDetails(id: string) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', id],
    queryFn: () => adminService.getPlatformSubscriptionDetails(id),
    enabled: !!id,
  });
}

// ── Social Platforms Hooks ────────────────
export function useSocialPlatforms() {
  return useQuery({
    queryKey: ['admin', 'social-platforms'],
    queryFn: () => adminService.getSocialPlatforms(),
  });
}

export function useSocialPlatform(id: string) {
  return useQuery({
    queryKey: ['admin', 'social-platforms', id],
    queryFn: () => adminService.getSocialPlatform(id),
    enabled: !!id,
  });
}

export function useSocialPlatformHealth(id: string) {
  return useQuery({
    queryKey: ['admin', 'social-platforms', id, 'health'],
    queryFn: () => adminService.getSocialPlatformHealth(id),
    enabled: !!id,
  });
}

export function useSocialPlatformStatistics(id: string) {
  return useQuery({
    queryKey: ['admin', 'social-platforms', id, 'statistics'],
    queryFn: () => adminService.getSocialPlatformStatistics(id),
    enabled: !!id,
  });
}

export function useSocialPlatformErrors(id: string, params: Record<string, unknown> = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['admin', 'social-platforms', id, 'errors', params],
    queryFn: () => adminService.getSocialPlatformErrors(id, params),
    enabled: !!id,
  });
}

export function useToggleSocialPlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      adminService.updateSocialPlatformStatus(id, enabled),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'social-platforms'] });
      toast.success(`Platform ${variables.enabled ? 'enabled' : 'disabled'} successfully`);
    },
    onError: () => toast.error('Failed to update platform status'),
  });
}

// ── Connected Accounts ──────────────────

export function useConnectedAccounts(params?: { search?: string; platform?: string; status?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'connected-accounts', params],
    queryFn: () => adminService.getConnectedAccounts(params),
  });
}

export function useConnectedAccountStatistics() {
  return useQuery({
    queryKey: ['admin', 'connected-accounts', 'statistics'],
    queryFn: () => adminService.getConnectedAccountStatistics(),
  });
}

export function useConnectedAccountErrors(id: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'connected-accounts', id, 'errors', params],
    queryFn: () => adminService.getConnectedAccountErrors(id, params),
    enabled: !!id,
  });
}

// ── Live Streams ──────────────────────────

export function useLiveStreams(params?: { search?: string; platform?: string; status?: string; workspaceId?: string; creatorId?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'live-streams', params],
    queryFn: () => adminService.getLiveStreams(params),
  });
}

export function useLiveStreamStatistics() {
  return useQuery({
    queryKey: ['admin', 'live-streams', 'statistics'],
    queryFn: () => adminService.getLiveStreamStatistics(),
  });
}

export function useLiveStreamErrors(id: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'live-streams', id, 'errors', params],
    queryFn: () => adminService.getLiveStreamErrors(id, params),
    enabled: !!id,
  });
}

// ── Admin Notifications ──────────────────────────

export function useAdminNotifications(params?: { search?: string; type?: string; targetType?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'notifications', params],
    queryFn: () => adminService.getAdminNotifications(params),
  });
}

export function useAdminNotificationStatistics() {
  return useQuery({
    queryKey: ['admin', 'notifications', 'statistics'],
    queryFn: () => adminService.getAdminNotificationStatistics(),
  });
}

export function usePreviewAdminNotification() {
  return useMutation({
    mutationFn: (payload: { type: string; title: string; message: string; targetType: string; targetUserId?: string; targetWorkspaceId?: string }) =>
      adminService.previewAdminNotification(payload),
  });
}

export function useSendAdminNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: { type: string; title: string; message: string; targetType: string; targetUserId?: string; targetWorkspaceId?: string }) =>
      adminService.sendAdminNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });
}


