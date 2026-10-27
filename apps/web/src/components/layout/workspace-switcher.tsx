'use client';

import { useWorkspace } from '@/hooks/use-workspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateWorkspaceDialog } from '../dialogs/create-workspace-dialog';
import { useAuthStore } from '@/stores/auth-store';

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const { user, scope } = useAuthStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const canCreateWorkspace =
    scope === 'PLATFORM' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'WORKSPACE_OWNER' ||
    currentWorkspace?.role === 'OWNER';

  if (scope === 'PLATFORM') {
    return (
      <div className="w-full h-12 px-3 flex items-center border border-border/40 rounded-xl bg-accent/30 cursor-default">
        <div className="flex items-center gap-3 w-full overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-violet-500/20">
            P
          </div>
          <div className="truncate flex-1 text-left">
            <p className="text-xs font-bold leading-none truncate">
              Platform
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate uppercase font-semibold tracking-wider text-violet-400">
              All Workspaces
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-12 px-3 hover:bg-accent/50 border border-border/40 rounded-xl"
          >
            <div className="flex items-center gap-3 text-left overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-violet-500/20">
                {currentWorkspace?.name.charAt(0).toUpperCase() || 'W'}
              </div>
              <div className="truncate flex-1 min-w-0">
                <p className="text-xs font-bold leading-none truncate">
                  {currentWorkspace?.name || 'Select Workspace'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-muted-foreground truncate">
                    {currentWorkspace?.slug || 'workspace'}
                  </span>
                  {currentWorkspace?.role && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                      {currentWorkspace.role}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 glass-panel p-2">
          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
            Workspaces ({workspaces.length})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-56 overflow-y-auto space-y-1">
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center font-semibold text-xs shrink-0">
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-medium truncate">{ws.name}</span>
                    {ws.role && (
                      <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                        {ws.role}
                      </span>
                    )}
                  </div>
                </div>
                {currentWorkspace?.id === ws.id && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
          {canCreateWorkspace && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-primary cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Workspace</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canCreateWorkspace && (
        <CreateWorkspaceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      )}
    </>
  );
}
