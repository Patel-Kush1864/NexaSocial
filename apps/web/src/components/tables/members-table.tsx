'use client';

import type { WorkspaceMember } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MembersTableProps {
  members: WorkspaceMember[];
  onRemove?: (memberId: string) => void;
  onUpdateRole?: (memberId: string, role: string) => void;
}

export function MembersTable({ members, onRemove, onUpdateRole }: MembersTableProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Owner</Badge>;
      case 'MANAGER':
        return <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20">Manager</Badge>;
      case 'CREATOR':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Creator</Badge>;
      default:
        return <Badge variant="secondary">Viewer</Badge>;
    }
  };

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden glass-panel">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                No members found in this workspace.
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
              const name = `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim() || 'User';
              const initials = name.charAt(0).toUpperCase() || 'U';

              return (
                <TableRow key={member.id} className="hover:bg-accent/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-primary/20">
                        <AvatarImage src={member.user?.avatar} alt={name} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold leading-none">{name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {member.user?.email || 'email@example.com'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {member.joinedAt
                      ? formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true })
                      : 'Recently'}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.role !== 'OWNER' && (
                      <div className="flex items-center justify-end gap-2">
                        {onUpdateRole && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateRole(member.id, 'MANAGER')}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {onRemove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemove(member.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
