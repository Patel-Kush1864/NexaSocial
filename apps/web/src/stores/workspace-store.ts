// ═══════════════════════════════════════════
// NexaSocial — Workspace Zustand Store
// ═══════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace } from '@/types';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];

  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  switchWorkspace: (workspaceId: string) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: string) => void;
  updateWorkspace: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      currentWorkspace: null,
      workspaces: [],

      setWorkspaces: (workspaces) => {
        const { currentWorkspace } = get();
        set({
          workspaces,
          // Auto-select first workspace if none selected
          currentWorkspace:
            currentWorkspace &&
            workspaces.find((w) => w.id === currentWorkspace.id)
              ? currentWorkspace
              : workspaces[0] || null,
        });
      },

      setCurrentWorkspace: (workspace) =>
        set({ currentWorkspace: workspace }),

      switchWorkspace: (workspaceId) => {
        const workspace = get().workspaces.find((w) => w.id === workspaceId);
        if (workspace) {
          set({ currentWorkspace: workspace });
        }
      },

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          currentWorkspace: state.currentWorkspace || workspace,
        })),

      removeWorkspace: (workspaceId) =>
        set((state) => {
          const workspaces = state.workspaces.filter(
            (w) => w.id !== workspaceId,
          );
          return {
            workspaces,
            currentWorkspace:
              state.currentWorkspace?.id === workspaceId
                ? workspaces[0] || null
                : state.currentWorkspace,
          };
        }),

      updateWorkspace: (workspace) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspace.id ? workspace : w,
          ),
          currentWorkspace:
            state.currentWorkspace?.id === workspace.id
              ? workspace
              : state.currentWorkspace,
        })),
    }),
    {
      name: 'nexasocial-workspace',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
      }),
    },
  ),
);
