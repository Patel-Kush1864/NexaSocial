import React from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';

interface WorkspaceProfileHeaderProps {
  workspace: any;
  onSuspend: () => void;
  onActivate: () => void;
  onArchive: () => void;
  canManage: boolean;
}

export function WorkspaceProfileHeader({
  workspace,
  onSuspend,
  onActivate,
  onArchive,
  canManage,
}: WorkspaceProfileHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 rounded-xl border border-border/50 glass-panel">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg">
          {workspace.logo ? (
            <img src={workspace.logo} alt={workspace.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Building2 className="w-8 h-8" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {workspace.name}
            <Badge className={
              workspace.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
              workspace.status === 'SUSPENDED' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
              'bg-secondary text-secondary-foreground'
            }>
              {workspace.status}
            </Badge>
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            <span>ID: <span className="font-mono">{workspace.id}</span></span>
            <span>Owner: {workspace.owner?.name} ({workspace.owner?.email})</span>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          {workspace.status !== 'ACTIVE' && workspace.status !== 'ARCHIVED' && (
            <Button size="sm" onClick={onActivate}>
              Activate
            </Button>
          )}
          {workspace.status === 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={onSuspend}>
              Suspend
            </Button>
          )}
          {workspace.status !== 'ARCHIVED' && (
            <Button variant="destructive" size="sm" onClick={onArchive}>
              Archive
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
