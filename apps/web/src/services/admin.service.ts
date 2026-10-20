/* eslint-disable @typescript-eslint/no-explicit-any */
// ═══════════════════════════════════════════
// NexaSocial — Admin API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type {
  User,
  Workspace,
  Plan,
  AdminPlan,
  Payment,
  AdminDashboardSummary,
  SystemHealth,
  PaginatedResponse,
  SuccessResponse,
  LoginCredentials,
  TokenResponse,
  PlatformActivityResponse,
  SystemHealthResult,
} from '@/types';

export const adminService = {
  // ── Auth ────────────────────────────────
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>(
      '/admin/auth/login',
      credentials,
    );
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/admin/auth/logout');
  },

  // ── Dashboard ───────────────────────────
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const { data } = await apiClient.get<AdminDashboardSummary>(
      '/admin/dashboard',
    );
    return data;
  },

  // ── Users ───────────────────────────────
  async getPlatformUsers(params: Record<string, unknown>) {
    const { data } = await apiClient.get('/users', { params });
    return data;
  },

  async getPlatformUserById(id: string) {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },

  async getUserWorkspaces(id: string, limit = 20, offset = 0) {
    const { data } = await apiClient.get(`/users/${id}/workspaces`, { params: { limit, offset } });
    return data;
  },

  async getUserSubscriptions(id: string) {
    const { data } = await apiClient.get(`/users/${id}/subscriptions`);
    return data;
  },

  async getUserPayments(id: string, limit = 20, offset = 0) {
    const { data } = await apiClient.get(`/users/${id}/payments`, { params: { limit, offset } });
    return data;
  },

  async getUserSocialAccounts(id: string) {
    const { data } = await apiClient.get(`/users/${id}/social-accounts`);
    return data;
  },

  async getUserStreams(id: string, limit = 20, offset = 0) {
    const { data } = await apiClient.get(`/users/${id}/streams`, { params: { limit, offset } });
    return data;
  },

  async getUserActivity(id: string, limit = 20, offset = 0) {
    const { data } = await apiClient.get(`/users/${id}/activity`, { params: { limit, offset } });
    return data;
  },

  async updatePlatformUserStatus(id: string, status: string) {
    const { data } = await apiClient.patch(`/users/${id}/status`, { status });
    return data;
  },

  async updatePlatformUserRole(id: string, roleId: string) {
    const { data } = await apiClient.patch(`/users/${id}/role`, { roleId });
    return data;
  },

  async getUsers(
    limit = 50,
    offset = 0,
  ): Promise<PaginatedResponse<User>> {
    const { data } = await apiClient.get<PaginatedResponse<User>>(
      '/admin/users',
      { params: { limit, offset } },
    );
    return data;
  },

  async getUserById(id: string): Promise<User> {
    const { data } = await apiClient.get<User>(`/admin/users/${id}`);
    return data;
  },

  async updateUserStatus(
    id: string,
    isActive: boolean,
  ): Promise<User> {
    const { data } = await apiClient.patch<User>(`/admin/users/${id}/status`, {
      isActive,
    });
    return data;
  },

  // ── Administrators ──────────────────────────
  async getAdministrators(params?: { search?: string; status?: string; role?: string; page?: number; limit?: number }) {
    const { data } = await apiClient.get('/admin/administrators', { params });
    return data;
  },

  async getAdministratorById(id: string) {
    const { data } = await apiClient.get(`/admin/administrators/${id}`);
    return data;
  },

  async createAdministrator(payload: { email: string; firstName?: string; lastName?: string; roleName: string; status?: string }) {
    const { data } = await apiClient.post('/admin/administrators', payload);
    return data;
  },

  async updateAdministratorRole(id: string, role: string) {
    const { data } = await apiClient.patch(`/admin/administrators/${id}/role`, { role });
    return data;
  },

  async updateAdministratorStatus(id: string, status: string) {
    const { data } = await apiClient.patch(`/admin/administrators/${id}/status`, { status });
    return data;
  },

  // ── Feature Flags ──────────────────────────
  async getFeatureFlags() {
    const { data } = await apiClient.get('/admin/feature-flags');
    return data;
  },

  async getFeatureFlagStatistics() {
    const { data } = await apiClient.get('/admin/feature-flags/statistics');
    return data;
  },

  async toggleFeatureFlag(key: string, enabled: boolean) {
    const { data } = await apiClient.patch(`/admin/feature-flags/${key}`, { enabled });
    return data;
  },

  async deleteUser(id: string): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/admin/users/${id}`,
    );
    return data;
  },

  // ── Workspaces ──────────────────────────
  async getWorkspaces(params: Record<string, unknown>) {
    const { data } = await apiClient.get('/admin/workspaces', { params });
    return data;
  },

  async getWorkspaceById(id: string) {
    const { data } = await apiClient.get(`/admin/workspaces/${id}`);
    return data;
  },

  async getWorkspaceMembers(id: string, limit = 20, offset = 0) {
    const { data } = await apiClient.get(`/admin/workspaces/${id}/members`, { params: { limit, offset } });
    return data;
  },

  async getWorkspaceSubscription(id: string) {
    const { data } = await apiClient.get(`/admin/workspaces/${id}/subscription`);
    return data;
  },

  async getWorkspaceUsage(id: string) {
    const { data } = await apiClient.get(`/admin/workspaces/${id}/usage`);
    return data;
  },

  async getWorkspaceSocialAccounts(id: string, limit = 20, offset = 0) {
    const { data } = await apiClient.get(`/admin/workspaces/${id}/social-accounts`, { params: { limit, offset } });
    return data;
  },

  async getWorkspaceStreams(id: string, limit = 20, offset = 0) {
    const { data } = await apiClient.get(`/admin/workspaces/${id}/streams`, { params: { limit, offset } });
    return data;
  },

  async getWorkspaceActivity(id: string, limit = 20, offset = 0) {
    const { data } = await apiClient.get(`/admin/workspaces/${id}/activity`, { params: { limit, offset } });
    return data;
  },

  async updateWorkspaceStatus(id: string, status: string) {
    const { data } = await apiClient.patch(`/admin/workspaces/${id}/status`, { status });
    return data;
  },

  async deleteWorkspace(id: string): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/admin/workspaces/${id}`,
    );
    return data;
  },

  // ── Subscriptions ───────────────────────
  async getPlatformSubscriptions(params?: Record<string, unknown>) {
    const { data } = await apiClient.get('/subscriptions/platform/all', { params });
    return data;
  },

  async getPlatformSubscriptionDetails(id: string) {
    const { data } = await apiClient.get(`/subscriptions/platform/${id}`);
    return data;
  },

  async getPlatformSubscriptionStatistics() {
    const { data } = await apiClient.get('/subscriptions/platform/statistics');
    return data;
  },

  async cancelPlatformSubscription(id: string) {
    const { data } = await apiClient.post(`/subscriptions/platform/${id}/cancel`);
    return data;
  },

  // ── Plans ───────────────────────────────
  async getPlans(
    params?: { search?: string; status?: string; billingCycle?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }
  ): Promise<PaginatedResponse<AdminPlan>> {
    const { data } = await apiClient.get<PaginatedResponse<AdminPlan>>('/admin/plans', { params });
    return data;
  },

  async getPlanDetails(id: string): Promise<AdminPlan> {
    const { data } = await apiClient.get<AdminPlan>(`/admin/plans/${id}`);
    return data;
  },

  async createPlan(payload: Partial<AdminPlan>): Promise<AdminPlan> {
    const { data } = await apiClient.post<AdminPlan>('/admin/plans', payload);
    return data;
  },

  async updatePlan(id: string, payload: Partial<AdminPlan>): Promise<AdminPlan> {
    const { data } = await apiClient.patch<AdminPlan>(`/admin/plans/${id}`, payload);
    return data;
  },

  async updatePlanStatus(id: string, status: string): Promise<SuccessResponse> {
    const { data } = await apiClient.patch<SuccessResponse>(
      `/admin/plans/${id}/status`,
      { status }
    );
    return data;
  },

  // ── Payments ────────────────────────────
  async getPlatformPayments(
    params?: any
  ): Promise<any> {
    const { data } = await apiClient.get<any>(
      '/payments',
      { params }
    );
    return data;
  },

  async getPlatformPaymentStatistics(params?: any): Promise<any> {
    const { data } = await apiClient.get<any>(
      '/payments/statistics',
      { params }
    );
    return data;
  },

  async getPlatformPaymentById(id: string): Promise<any> {
    const { data } = await apiClient.get<any>(`/payments/${id}`);
    return data;
  },

  async exportPlatformPayments(params?: any): Promise<Blob> {
    const { data } = await apiClient.get<Blob>('/payments/export', {
      params,
      responseType: 'blob',
    });
    return data;
  },

  // ── Social Platforms ────────────────────
  async getSocialPlatforms(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const { data } = await apiClient.get('/admin/social-platforms', { params });
    return data;
  },

  async getSocialPlatform(id: string) {
    const { data } = await apiClient.get(`/admin/social-platforms/${id}`);
    return data;
  },

  async toggleSocialPlatformStatus(id: string, enabled: boolean) {
    const { data } = await apiClient.patch(`/admin/social-platforms/${id}/status`, { enabled });
    return data;
  },

  async getSocialPlatformHealth(id: string) {
    const { data } = await apiClient.get(`/admin/social-platforms/${id}/health`);
    return data;
  },

  async getSocialPlatformStatistics(id: string) {
    const { data } = await apiClient.get(`/admin/social-platforms/${id}/statistics`);
    return data;
  },

  async getSocialPlatformErrors(id: string, params?: { page?: number; limit?: number }) {
    const { data } = await apiClient.get(`/admin/social-platforms/${id}/errors`, { params });
    return data;
  },

  // ── Connected Accounts ──────────────────
  async getConnectedAccounts(params?: { search?: string; platform?: string; status?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) {
    const { data } = await apiClient.get('/admin/connected-accounts', { params });
    return data;
  },

  async getConnectedAccountStatistics() {
    const { data } = await apiClient.get('/admin/connected-accounts/statistics');
    return data;
  },

  async getConnectedAccountErrors(id: string, params?: { page?: number; limit?: number }) {
    const { data } = await apiClient.get(`/admin/connected-accounts/${id}/errors`, { params });
    return data;
  },

  // ── Live Streams ────────────────────────
  async getLiveStreams(params?: { search?: string; platform?: string; status?: string; workspaceId?: string; creatorId?: string; dateFrom?: string; dateTo?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) {
    const { data } = await apiClient.get('/admin/live-streams', { params });
    return data;
  },

  async getLiveStreamStatistics() {
    const { data } = await apiClient.get('/admin/live-streams/statistics');
    return data;
  },

  async getLiveStreamErrors(id: string, params?: { page?: number; limit?: number }) {
    const { data } = await apiClient.get(`/admin/live-streams/${id}/errors`, { params });
    return data;
  },

  async updateSocialPlatformStatus(id: string, enabled: boolean) {
    const { data } = await apiClient.patch(`/admin/social-platforms/${id}/status`, { enabled });
    return data;
  },

  // ── Admin Notifications ──────────────────
  async getAdminNotifications(params?: { search?: string; type?: string; targetType?: string; sortBy?: string; sortOrder?: string; page?: number; limit?: number }) {
    const { data } = await apiClient.get('/admin/notifications', { params });
    return data;
  },

  async getAdminNotificationStatistics() {
    const { data } = await apiClient.get('/admin/notifications/statistics');
    return data;
  },

  async previewAdminNotification(payload: { type: string; title: string; message: string; targetType: string; targetUserId?: string; targetWorkspaceId?: string }) {
    const { data } = await apiClient.post('/admin/notifications/preview', payload);
    return data;
  },

  async sendAdminNotification(payload: { type: string; title: string; message: string; targetType: string; targetUserId?: string; targetWorkspaceId?: string }) {
    const { data } = await apiClient.post('/admin/notifications/send', payload);
    return data;
  },

  // ── System Health ───────────────────────
  async getSystemHealth(): Promise<SystemHealthResult> {
    const { data } = await apiClient.get<SystemHealthResult>(
      '/platform/system-health',
    );
    return data;
  },

  async refreshSystemHealth(): Promise<SystemHealthResult> {
    const { data } = await apiClient.post<SystemHealthResult>(
      '/platform/system-health/refresh',
    );
    return data;
  },

  async getFailedJobs(queue = 'default', page = 1, limit = 20) {
    const { data } = await apiClient.get('/platform/system-health/failed-jobs', {
      params: { queue, page, limit },
    });
    return data;
  },

  // ── Platform Activity ───────────────────
  async getPlatformActivity(
    params: { category?: string; page?: number; limit?: number; search?: string; dateFrom?: string; dateTo?: string }
  ): Promise<PlatformActivityResponse> {
    const { data } = await apiClient.get<PlatformActivityResponse>(
      '/platform/activity',
      {
        params: {
          module: params.category !== 'ALL' ? params.category : undefined,
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search || undefined,
          dateFrom: params.dateFrom || undefined,
          dateTo: params.dateTo || undefined,
        },
      },
    );
    return data;
  },

  // ── Email System Management ─────────────
  async getEmailStatus(): Promise<EmailStatusResult> {
    const { data } = await apiClient.get<EmailStatusResult>('/admin/email/status');
    return data;
  },

  async sendTestEmail(recipient?: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/admin/email/test', { recipient });
    return data;
  },

  async getEmailStats(): Promise<EmailStatsResult> {
    const { data } = await apiClient.get<EmailStatsResult>('/admin/email/stats');
    return data;
  },

  async getEmailLogs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    eventType?: string;
    recipient?: string;
  }): Promise<EmailLogsResponse> {
    const { data } = await apiClient.get<EmailLogsResponse>('/admin/email/logs', { params });
    return data;
  },

  async retryEmail(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(`/admin/email/retry/${id}`);
    return data;
  },
};

export interface EmailStatusResult {
  isConnected: boolean;
  host: string;
  port: number;
  user: string;
  error?: string;
}

export interface EmailStatsResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  pending: number;
  rate: number;
}

export interface EmailLogItem {
  id: string;
  recipient: string;
  userId?: string;
  eventType: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  errorMessage?: string;
  retryCount: number;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  sentAt?: string;
  createdAt: string;
}

export interface EmailLogsResponse {
  logs: EmailLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
