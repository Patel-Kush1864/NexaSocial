// ═══════════════════════════════════════════
// NexaSocial — Admin API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type {
  User,
  Workspace,
  Plan,
  Payment,
  AdminDashboardSummary,
  SystemHealth,
  PaginatedResponse,
  SuccessResponse,
} from '@/types';

export const adminService = {
  // ── Dashboard ───────────────────────────
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const { data } = await apiClient.get<AdminDashboardSummary>(
      '/admin/dashboard',
    );
    return data;
  },

  // ── Users ───────────────────────────────
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

  async deleteUser(id: string): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/admin/users/${id}`,
    );
    return data;
  },

  // ── Workspaces ──────────────────────────
  async getWorkspaces(
    limit = 50,
    offset = 0,
  ): Promise<PaginatedResponse<Workspace>> {
    const { data } = await apiClient.get<PaginatedResponse<Workspace>>(
      '/admin/workspaces',
      { params: { limit, offset } },
    );
    return data;
  },

  async getWorkspaceById(id: string): Promise<Workspace> {
    const { data } = await apiClient.get<Workspace>(
      `/admin/workspaces/${id}`,
    );
    return data;
  },

  async updateWorkspaceStatus(
    id: string,
    isActive: boolean,
  ): Promise<Workspace> {
    const { data } = await apiClient.patch<Workspace>(
      `/admin/workspaces/${id}/status`,
      { isActive },
    );
    return data;
  },

  async deleteWorkspace(id: string): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/admin/workspaces/${id}`,
    );
    return data;
  },

  // ── Plans ───────────────────────────────
  async getPlans(): Promise<Plan[]> {
    const { data } = await apiClient.get<Plan[]>('/admin/plans');
    return data;
  },

  async createPlan(payload: Partial<Plan>): Promise<Plan> {
    const { data } = await apiClient.post<Plan>('/admin/plans', payload);
    return data;
  },

  async updatePlan(id: string, payload: Partial<Plan>): Promise<Plan> {
    const { data } = await apiClient.put<Plan>(`/admin/plans/${id}`, payload);
    return data;
  },

  async deletePlan(id: string): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/admin/plans/${id}`,
    );
    return data;
  },

  // ── Payments ────────────────────────────
  async getPayments(
    limit = 50,
    offset = 0,
  ): Promise<PaginatedResponse<Payment>> {
    const { data } = await apiClient.get<PaginatedResponse<Payment>>(
      '/admin/payments',
      { params: { limit, offset } },
    );
    return data;
  },

  async getPaymentById(id: string): Promise<Payment> {
    const { data } = await apiClient.get<Payment>(`/admin/payments/${id}`);
    return data;
  },

  async getRefunds(
    limit = 50,
    offset = 0,
  ): Promise<PaginatedResponse<Payment>> {
    const { data } = await apiClient.get<PaginatedResponse<Payment>>(
      '/admin/refunds',
      { params: { limit, offset } },
    );
    return data;
  },

  // ── Social Platforms ────────────────────
  async getSocialPlatforms() {
    const { data } = await apiClient.get('/admin/social-platforms');
    return data;
  },

  async updateSocialPlatformConfig(
    id: string,
    payload: Record<string, unknown>,
  ) {
    const { data } = await apiClient.put(
      `/admin/social-platforms/${id}`,
      payload,
    );
    return data;
  },

  // ── System Health ───────────────────────
  async getSystemHealth(): Promise<SystemHealth> {
    const { data } = await apiClient.get<SystemHealth>(
      '/admin/system/health',
    );
    return data;
  },
};
