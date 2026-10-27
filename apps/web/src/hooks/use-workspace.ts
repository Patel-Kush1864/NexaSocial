'use client';

// ═══════════════════════════════════════════
// NexaSocial — Workspace Hook
// ═══════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { workspaceService } from '@/services/workspace.service';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export function useWorkspace() {
  const queryClient = useQueryClient();
  const {
    currentWorkspace,
    workspaces,
    setWorkspaces,
    setCurrentWorkspace,
    switchWorkspace,
  } = useWorkspaceStore();

  // Fetch all user workspaces
  const workspacesQuery = useQuery({
    queryKey: queryKeys.workspaces.all,
    queryFn: async () => {
      const data = await workspaceService.getAll();
      setWorkspaces(data);
      return data;
    },
  });

  // Create workspace mutation
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string; description?: string }) =>
      workspaceService.create(payload),
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      setCurrentWorkspace(newWorkspace);
      toast.success('Workspace created', {
        description: `Switched to ${newWorkspace.name}`,
      });
    },
    onError: (err: AxiosError<ApiError>) => {
      const serverMsg = err?.response?.data?.message;
      const displayMsg = Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg;
      toast.error(displayMsg || 'Failed to create workspace');
    },
  });

  // Switch workspace mutation
  const switchMutation = useMutation({
    mutationFn: (workspaceId: string) =>
      workspaceService.switchWorkspace(workspaceId),
    onSuccess: (res) => {
      switchWorkspace(res.workspace.id);
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'entitlements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.members(res.workspace.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.invitations(res.workspace.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.all(res.workspace.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.social.accounts(res.workspace.id) });
      toast.success('Workspace switched', {
        description: `Active workspace: ${res.workspace.name}`,
      });
    },
    onError: () => {
      toast.error('Failed to switch workspace');
    },
  });

  // Update workspace mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { name?: string; description?: string };
    }) => workspaceService.update(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.detail(updated.id),
      });
      toast.success('Workspace updated');
    },
    onError: () => {
      toast.error('Failed to update workspace');
    },
  });

  // Delete workspace mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => workspaceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
      toast.success('Workspace deleted');
    },
    onError: () => {
      toast.error('Failed to delete workspace');
    },
  });

  return {
    currentWorkspace,
    workspaces,
    isLoading: workspacesQuery.isLoading,
    refetch: workspacesQuery.refetch,
    createWorkspace: createMutation.mutateAsync,
    switchWorkspace: switchMutation.mutateAsync,
    updateWorkspace: updateMutation.mutateAsync,
    deleteWorkspace: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isSwitching: switchMutation.isPending,
  };
}

export function useWorkspaceMembers(workspaceId?: string) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: queryKeys.workspaces.members(workspaceId || ''),
    queryFn: () => workspaceService.getMembers(workspaceId!),
    enabled: !!workspaceId,
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
    }: {
      workspaceId: string;
      memberId: string;
    }) => workspaceService.removeMember(workspaceId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(variables.workspaceId),
      });
      toast.success('Member removed');
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
      role,
    }: {
      workspaceId: string;
      memberId: string;
      role: string;
    }) => workspaceService.updateMemberRole(workspaceId, memberId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(variables.workspaceId),
      });
      toast.success('Member role updated');
    },
    onError: () => {
      toast.error('Failed to update member role');
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: ({
      workspaceId,
      email,
      role,
    }: {
      workspaceId: string;
      email: string;
      role: string;
    }) => workspaceService.inviteMember(workspaceId, { email, role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.members(variables.workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(variables.workspaceId),
      });
      toast.success('Invitation sent', {
        description: `Sent invite link to ${variables.email} as ${variables.role}`,
      });
    },
    onError: (err: any) => {
      const serverMsg = err?.response?.data?.message;
      const displayMsg = Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg;
      toast.error(displayMsg || 'Failed to send invitation');
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    removeMember: removeMemberMutation.mutateAsync,
    updateRole: updateRoleMutation.mutateAsync,
    inviteMember: inviteMemberMutation.mutateAsync,
    isInviting: inviteMemberMutation.isPending,
  };
}

export function useWorkspaceInvitations(workspaceId?: string) {
  const queryClient = useQueryClient();

  const invitationsQuery = useQuery({
    queryKey: queryKeys.workspaces.invitations(workspaceId || ''),
    queryFn: () => workspaceService.getPendingInvitations(workspaceId!),
    enabled: !!workspaceId,
    refetchOnMount: 'always',
  });

  const resendMutation = useMutation({
    mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
      workspaceService.resendInvitation(workspaceId, invitationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(variables.workspaceId),
      });
      toast.success('Invitation resent successfully');
    },
    onError: () => {
      toast.error('Failed to resend invitation');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
      workspaceService.cancelInvitation(workspaceId, invitationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspaces.invitations(variables.workspaceId),
      });
      toast.success('Invitation cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel invitation');
    },
  });

  return {
    invitations: invitationsQuery.data || [],
    isLoading: invitationsQuery.isLoading,
    refetch: invitationsQuery.refetch,
    resendInvitation: resendMutation.mutateAsync,
    cancelInvitation: cancelMutation.mutateAsync,
    isResending: resendMutation.isPending,
  };
}
