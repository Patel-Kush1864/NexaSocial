'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { UserPlus, MoreHorizontal, Shield, Trash, Mail, X, RefreshCw, Send } from 'lucide-react';
import { InviteMemberDialog } from '@/components/dialogs/invite-member-dialog';
import { ChangeRoleDialog } from '@/components/dialogs/change-role-dialog';
import { useWorkspace, useWorkspaceMembers, useWorkspaceInvitations } from '@/hooks/use-workspace';
import { useAuthStore } from '@/stores/auth-store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRelativeTime, formatExpiration } from '@/lib/utils';
import type { WorkspaceInvitation } from '@/types';

export default function TeamPage() {
  const { currentWorkspace } = useWorkspace();
  const { user, hasPermission } = useAuthStore();
  const { members, isLoading, removeMember } = useWorkspaceMembers(currentWorkspace?.id);
  const {
    invitations,
    isLoading: isInvitesLoading,
    refetch: refetchInvitations,
    resendInvitation,
    cancelInvitation,
  } = useWorkspaceInvitations(currentWorkspace?.id);
  
  const canInvite = hasPermission('team.members.invite');
  const canUpdate = hasPermission('team.members.update') || hasPermission('team.roles.assign');
  const canRemove = hasPermission('team.members.remove');

  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [inviteFilter, setInviteFilter] = useState<'all' | 'mine'>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [changeRoleState, setChangeRoleState] = useState<{ open: boolean; memberId: string; role: string; name: string }>({
    open: false,
    memberId: '',
    role: '',
    name: '',
  });

  const getMemberName = (u: any) => {
    if (!u) return 'Unknown User';
    if (u.firstName || u.lastName) {
      return `${u.firstName || ''} ${u.lastName || ''}`.trim();
    }
    return u.email || 'Unknown User';
  };

  const myInvitations = (invitations as WorkspaceInvitation[]).filter(
    (inv) => inv.invitedById === user?.id || inv.invitedBy?.id === user?.id,
  );
  const displayedInvitations = inviteFilter === 'mine' ? myInvitations : (invitations as WorkspaceInvitation[]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Team Members"
        description="Manage your workspace team members, roles, and invitations."
        action={
          canInvite ? (
            <Button onClick={() => setInviteOpen(true)} className="bg-primary text-primary-foreground">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          ) : undefined
        }
      />

      <Tabs
        defaultValue="members"
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as 'members' | 'invitations');
          if (val === 'invitations') {
            refetchInvitations();
          }
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-[440px] mb-4">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <span>Active Members</span>
            {members && members.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
                {members.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <span>Pending Invitations</span>
            {invitations && invitations.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 bg-primary/20 text-primary">
                {invitations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="border rounded-xl glass-panel overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.user?.avatar || ''} />
                        <AvatarFallback>
                          {getMemberName(member.user).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{getMemberName(member.user)}</span>
                        <span className="text-xs text-muted-foreground">{member.user?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(
                        member.joinedAt || member.joined_at || member.createdAt || member.created_at,
                        { addSuffix: true },
                        'Recently',
                      )}
                    </TableCell>
                    <TableCell>
                      {(canUpdate || canRemove) && member.role !== 'OWNER' ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setChangeRoleState({
                                    open: true,
                                    memberId: member.id,
                                    role: member.role,
                                    name: getMemberName(member.user),
                                  });
                                }}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                            )}
                            {canUpdate && canRemove && <DropdownMenuSeparator />}
                            {canRemove && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (currentWorkspace && member.role !== 'OWNER') {
                                    removeMember({ workspaceId: currentWorkspace.id, memberId: member.id });
                                  }
                                }}
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="invitations" className="border rounded-xl glass-panel overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border/50 bg-zinc-900/30">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-900/60 rounded-lg border border-border/50">
              <button
                type="button"
                onClick={() => setInviteFilter('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  inviteFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Invitations ({invitations.length})
              </button>
              <button
                type="button"
                onClick={() => setInviteFilter('mine')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  inviteFilter === 'mine'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Send className="w-3 h-3" />
                Sent by Me ({myInvitations.length})
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchInvitations()}
              disabled={isInvitesLoading}
              className="text-xs h-8 border-border/60 hover:bg-muted/50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isInvitesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Sent / Expires</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInvitesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Loading invitations...
                  </TableCell>
                </TableRow>
              ) : displayedInvitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Mail className="w-6 h-6 text-muted-foreground/50 mb-1" />
                      <span className="font-medium text-foreground text-sm">
                        {inviteFilter === 'mine'
                          ? "You haven't sent any pending invitations"
                          : 'No pending invitations'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {inviteFilter === 'mine'
                          ? "Switch to 'All Invitations' or send an invitation using the button above."
                          : 'Invite colleagues or collaborators to join your workspace.'}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayedInvitations.map((invite) => {
                  const isSentByMe = invite.invitedById === user?.id || invite.invitedBy?.id === user?.id;
                  return (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                            {invite.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{invite.email}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">ID: {invite.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {invite.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invite.invitedBy ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={invite.invitedBy.avatar || ''} />
                              <AvatarFallback className="text-[10px]">
                                {getMemberName(invite.invitedBy).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-medium text-foreground">
                                {getMemberName(invite.invitedBy)}
                              </span>
                              {isSentByMe && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30 font-medium">
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Workspace Admin</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex flex-col">
                          <span>
                            {formatRelativeTime(
                              invite.createdAt || invite.created_at,
                              { addSuffix: true },
                              'Recently',
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground/80">
                            {formatExpiration(invite.expiresAt || invite.expires_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canInvite || canRemove ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canInvite && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (currentWorkspace) {
                                      resendInvitation({ workspaceId: currentWorkspace.id, invitationId: invite.id });
                                    }
                                  }}
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Resend
                                </DropdownMenuItem>
                              )}
                              {canInvite && canRemove && <DropdownMenuSeparator />}
                              {canRemove && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    if (currentWorkspace) {
                                      cancelInvitation({ workspaceId: currentWorkspace.id, invitationId: invite.id });
                                    }
                                  }}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel Invite
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {currentWorkspace && (
        <InviteMemberDialog
          workspaceId={currentWorkspace.id}
          open={inviteOpen}
          onOpenChange={setInviteOpen}
        />
      )}

      {currentWorkspace && (
        <ChangeRoleDialog
          workspaceId={currentWorkspace.id}
          memberId={changeRoleState.memberId}
          currentRole={changeRoleState.role}
          memberName={changeRoleState.name}
          open={changeRoleState.open}
          onOpenChange={(open) => setChangeRoleState((prev) => ({ ...prev, open }))}
        />
      )}
    </div>
  );
}
