'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { UserPlus, MoreHorizontal, Shield, Trash, Mail, X } from 'lucide-react';
import { InviteMemberDialog } from '@/components/dialogs/invite-member-dialog';
import { ChangeRoleDialog } from '@/components/dialogs/change-role-dialog';
import { useWorkspace, useWorkspaceMembers, useWorkspaceInvitations } from '@/hooks/use-workspace';
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
import { formatDistanceToNow } from 'date-fns';

export default function TeamPage() {
  const { currentWorkspace } = useWorkspace();
  const { members, isLoading, removeMember } = useWorkspaceMembers(currentWorkspace?.id);
  const { invitations, isLoading: isInvitesLoading, resendInvitation, cancelInvitation } = useWorkspaceInvitations(currentWorkspace?.id);
  
  const [inviteOpen, setInviteOpen] = useState(false);
  const [changeRoleState, setChangeRoleState] = useState<{ open: boolean; memberId: string; role: string; name: string }>({
    open: false,
    memberId: '',
    role: '',
    name: '',
  });

  const getMemberName = (user: any) => {
    if (!user) return 'Unknown User';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email || 'Unknown User';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Team Members"
        description="Manage your workspace team members, roles, and invitations."
        action={
          <Button onClick={() => setInviteOpen(true)} className="bg-primary text-primary-foreground">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        }
      />

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
          <TabsTrigger value="members">Active Members</TabsTrigger>
          <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
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
                      {member.joinedAt ? formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true }) : 'Recently'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={member.role === 'OWNER'}
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={member.role === 'OWNER'}
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="invitations" className="border rounded-xl glass-panel overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Sent / Expires</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isInvitesLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Loading invitations...
                  </TableCell>
                </TableRow>
              ) : invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No pending invitations.
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((invite: any) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">
                      {invite.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {invite.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}</span>
                        <span className="text-[10px]">Expires in {formatDistanceToNow(new Date(invite.expiresAt))}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                          <DropdownMenuSeparator />
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
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
