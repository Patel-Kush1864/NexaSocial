// ═══════════════════════════════════════════
// NexaSocial — Workspace API Service
// ═══════════════════════════════════════════

import apiClient from '@/lib/api-client';
import type { Workspace, WorkspaceMember, SuccessResponse } from '@/types';

export const workspaceService = {
  // ── CRUD ────────────────────────────────
  async getAll(): Promise<Workspace[]> {
    const { data } = await apiClient.get<Workspace[]>('/workspaces');
    return data;
  },

  async getById(id: string): Promise<Workspace> {
    const { data } = await apiClient.get<Workspace>(`/workspaces/${id}`);
    return data;
  },

  async create(payload: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<Workspace> {
    const { data } = await apiClient.post<Workspace>('/workspaces', payload);
    return data;
  },

  async update(
    id: string,
    payload: { name?: string; description?: string },
  ): Promise<Workspace> {
    const { data } = await apiClient.put<Workspace>(
      `/workspaces/${id}`,
      payload,
    );
    return data;
  },

  async delete(id: string): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/workspaces/${id}`,
    );
    return data;
  },

  async switchWorkspace(
    workspaceId: string,
  ): Promise<{ success: boolean; workspace: Workspace }> {
    const { data } = await apiClient.post<{
      success: boolean;
      workspace: Workspace;
    }>('/workspaces/switch', { workspaceId });
    return data;
  },

  async transferOwnership(
    id: string,
    payload: { newOwnerId: string },
  ): Promise<Workspace> {
    const { data } = await apiClient.post<Workspace>(
      `/workspaces/${id}/transfer`,
      payload,
    );
    return data;
  },

  async getDashboard(id: string) {
    const { data } = await apiClient.get(`/workspaces/${id}/dashboard`);
    return data;
  },

  // ── Members ─────────────────────────────
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data } = await apiClient.get<WorkspaceMember[]>(
      `/workspaces/${workspaceId}/members`,
    );
    return data;
  },

  async removeMember(
    workspaceId: string,
    memberId: string,
  ): Promise<SuccessResponse> {
    const { data } = await apiClient.delete<SuccessResponse>(
      `/workspaces/${workspaceId}/members/${memberId}`,
    );
    return data;
  },

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: string,
  ): Promise<WorkspaceMember> {
    const { data } = await apiClient.patch<WorkspaceMember>(
      `/workspaces/${workspaceId}/members/${memberId}`,
      { role },
    );
    return data;
  },

  async leaveWorkspace(workspaceId: string): Promise<SuccessResponse> {
    const { data } = await apiClient.post<SuccessResponse>(
      `/workspaces/${workspaceId}/leave`,
    );
    return data;
  },

  async inviteMember(
    workspaceId: string,
    payload: { email: string; role: string },
  ): Promise<SuccessResponse> {
    const { data } = await apiClient.post<SuccessResponse>(
      `/workspaces/${workspaceId}/invite`,
      payload,
    );
    return data;
  },

  async getPendingInvitations(workspaceId: string): Promise<any[]> {
    const { data } = await apiClient.get<any[]>(
      `/workspaces/${workspaceId}/invitations`,
    );
    return data;
  },

  async resendInvitation(
    workspaceId: string,
    invitationId: string,
  ): Promise<SuccessResponse> {
    const { data } = await apiClient.post<SuccessResponse>(
      `/workspaces/${workspaceId}/invitations/${invitationId}/resend`,
    );
    return data;
  },

  async cancelInvitation(
    workspaceId: string,
    invitationId: string,
  ): Promise<SuccessResponse> {
    const { data } = await apiClient.post<SuccessResponse>(
      `/workspaces/${workspaceId}/invitations/${invitationId}/cancel`,
    );
    return data;
  },

  async acceptInvitation(token: string): Promise<{ success: boolean; workspaceId: string }> {
    const { data } = await apiClient.post<{ success: boolean; workspaceId: string }>(
      '/workspaces/invitations/accept',
      { token },
    );
    return data;
  },

  async rejectInvitation(token: string): Promise<SuccessResponse> {
    const { data } = await apiClient.post<SuccessResponse>(
      '/workspaces/invitations/reject',
      { token },
    );
    return data;
  },
};
