'use client';

import { useAdminUsers } from '@/hooks/use-admin';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, Shield, UserX, UserCheck } from 'lucide-react';

export default function AdminUsersPage() {
  const { data, isLoading, updateStatus, deleteUser } = useAdminUsers();

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading system users..." />;
  }

  const users = data?.data || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="User Management"
        description="Monitor registered accounts, suspend violations, or assign admin permissions."
        badge={`${users.length} Registered`}
      />

      <div className="rounded-xl border border-border/50 overflow-hidden glass-panel">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  No users found in database.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User';
                const initials = name.charAt(0).toUpperCase();

                return (
                  <TableRow key={u.id} className="hover:bg-accent/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-primary/20">
                          <AvatarImage src={u.avatar} alt={name} />
                          <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold leading-none">{name}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.role === 'ADMIN' ? (
                        <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">
                          <Shield className="w-3 h-3 mr-1" />
                          ADMIN
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">USER</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">Suspended</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {u.isEmailVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateStatus({ id: u.id, isActive: !u.isActive })}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteUser(u.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
