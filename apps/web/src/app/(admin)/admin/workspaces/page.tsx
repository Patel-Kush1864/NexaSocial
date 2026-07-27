'use client';

import { useAdminWorkspaces } from '@/hooks/use-admin';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Building2 } from 'lucide-react';

export default function AdminWorkspacesPage() {
  const { data, isLoading, deleteWorkspace } = useAdminWorkspaces();

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading system workspaces..." />;
  }

  const workspaces = data?.data || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workspace Management"
        description="Monitor system-wide workspaces, slug allocations, and member counts."
        badge={`${workspaces.length} Total`}
      />

      <div className="rounded-xl border border-border/50 overflow-hidden glass-panel">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Owner ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  No workspaces found in system.
                </TableCell>
              </TableRow>
            ) : (
              workspaces.map((ws) => (
                <TableRow key={ws.id} className="hover:bg-accent/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">{ws.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{ws.slug}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[150px]">
                    {ws.ownerId}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWorkspace(ws.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
