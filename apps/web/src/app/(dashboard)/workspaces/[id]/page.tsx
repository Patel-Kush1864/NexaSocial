'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '@/services/workspace.service';
import { queryKeys } from '@/lib/query-client';
import { PageHeader } from '@/components/shared/page-header';
import { MembersTable } from '@/components/tables/members-table';
import { InviteMemberDialog } from '@/components/dialogs/invite-member-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { UserPlus, Building2, Shield, Settings } from 'lucide-react';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: workspace, isLoading: isWsLoading } = useQuery({
    queryKey: queryKeys.workspaces.detail(id),
    queryFn: () => workspaceService.getById(id),
    enabled: !!id,
  });

  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: queryKeys.workspaces.members(id),
    queryFn: () => workspaceService.getMembers(id),
    enabled: !!id,
  });

  if (isWsLoading || isMembersLoading) {
    return <LoadingSpinner size="lg" label="Loading workspace details..." />;
  }

  if (!workspace) {
    return <div className="py-12 text-center text-sm font-semibold">Workspace not found</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={workspace.name}
        description={`Manage team members, roles, and settings for workspace ${workspace.slug}.`}
        action={
          <Button
            onClick={() => setIsInviteOpen(true)}
            className="h-10 text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20"
          >
            <UserPlus className="w-3.5 h-3.5 mr-2" />
            Invite Member
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              Workspace Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono font-semibold">{workspace.slug}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/30">
              <span className="text-muted-foreground">Members</span>
              <span className="font-semibold">{members.length}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-emerald-500">Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Permissions Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-1">
            <p>
              <strong className="text-foreground">Owner:</strong> Full admin & billing control.
            </p>
            <p>
              <strong className="text-foreground">Manager:</strong> Edit streams & social channels.
            </p>
            <p>
              <strong className="text-foreground">Creator:</strong> Schedule streams & publish.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              Workspace Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs font-semibold">
              Edit Workspace Name
            </Button>
            <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-destructive font-semibold">
              Delete Workspace
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Team Members ({members.length})</h3>
        <MembersTable members={members} />
      </div>

      <InviteMemberDialog
        workspaceId={workspace.id}
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </div>
  );
}
