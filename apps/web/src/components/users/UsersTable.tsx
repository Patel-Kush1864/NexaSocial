import React from 'react';
import Link from 'next/link';
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
import { MoreVertical, Shield } from 'lucide-react';
import { UserStatusBadge } from './UserStatusBadge';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';
import { useAuthStore } from '@/stores/auth-store';
import dayjs from 'dayjs';

interface UsersTableProps {
  users: any[];
  isLoading: boolean;
  onActivate: (id: string) => void;
  onSuspend: (id: string) => void;
  onDeactivate: (id: string) => void;
  onChangeRole: (id: string, roleId: string) => void;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function UsersTable({
  users,
  isLoading,
  onActivate,
  onSuspend,
  onDeactivate,
  onChangeRole,
  onSort,
  sortBy,
  sortOrder,
}: UsersTableProps) {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('platform.users.manage');

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Loading users...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No users found matching your criteria.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden glass-panel">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <SortableTableHead 
              label="User" 
              sortKey="name" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <TableHead>Role</TableHead>
            <SortableTableHead 
              label="Status" 
              sortKey="status" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <TableHead>Workspaces</TableHead>
            <SortableTableHead 
              label="Last Login" 
              sortKey="lastLogin" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <SortableTableHead 
              label="Created" 
              sortKey="createdAt" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
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
                      <p className="text-sm font-bold leading-none">{name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {u.role?.name === 'SUPER_ADMIN' || u.role?.name === 'ADMIN' ? (
                    <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[10px]">
                      <Shield className="w-3 h-3 mr-1" />
                      {u.role.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {u.role?.name?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <UserStatusBadge status={u.status} />
                </TableCell>
                <TableCell>
                  <span className="text-sm">{u.workspaceCount || 0}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {u.lastLoginAt ? dayjs(u.lastLoginAt).fromNow() : 'Never'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {dayjs(u.created_at).format('MMM DD, YYYY')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/users/${u.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs">
                        View
                      </Button>
                    </Link>
                    
                    {canManage && (
                      <div className="relative group">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-1 flex flex-col">
                          {u.status !== 'ACTIVE' && (
                            <button onClick={() => onActivate(u.id)} className="text-left px-2 py-1.5 text-xs rounded hover:bg-accent hover:text-accent-foreground w-full">Activate</button>
                          )}
                          {u.status === 'ACTIVE' && (
                            <button onClick={() => onSuspend(u.id)} className="text-left px-2 py-1.5 text-xs rounded hover:bg-accent hover:text-accent-foreground w-full">Suspend</button>
                          )}
                          {u.status !== 'DEACTIVATED' && (
                            <button onClick={() => onDeactivate(u.id)} className="text-left px-2 py-1.5 text-xs rounded hover:bg-destructive/10 text-destructive w-full">Deactivate</button>
                          )}
                          <div className="h-px bg-border my-1" />
                          <button onClick={() => onChangeRole(u.id, u.role?.id)} className="text-left px-2 py-1.5 text-xs rounded hover:bg-accent hover:text-accent-foreground w-full">Change Role</button>
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
