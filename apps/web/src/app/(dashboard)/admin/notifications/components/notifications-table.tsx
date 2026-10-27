'use client';

import { format } from 'date-fns';
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
import {
  Eye,
  Bell,
  Megaphone,
  Cpu,
  Wrench,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
  User,
  Building2,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';

interface NotificationsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notifications: any[];
  isLoading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onViewDetails: (notification: any) => void;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSendFirst?: () => void;
}

export function NotificationsTable({
  notifications,
  isLoading,
  onViewDetails,
  onSort,
  sortBy,
  sortOrder,
  onSendFirst,
}: NotificationsTableProps) {
  if (isLoading) {
    return (
      <div className="py-16 flex items-center justify-center rounded-2xl border border-border/40 bg-card/20 backdrop-blur-sm">
        <LoadingSpinner size="lg" label="Loading notification history..." />
      </div>
    );
  }

  if (!notifications?.length) {
    return (
      <EmptyState
        icon={Bell}
        title="No Notifications Dispatched Yet"
        description="You haven't dispatched any platform announcements or broadcast notifications yet. Create your first notification to reach users."
        actionLabel={onSendFirst ? 'Send First Notification' : undefined}
        onAction={onSendFirst}
        className="my-8"
      />
    );
  }

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1.5 font-medium py-0.5">
            <Megaphone className="w-3 h-3" />
            Announcement
          </Badge>
        );
      case 'SYSTEM':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1.5 font-medium py-0.5">
            <Cpu className="w-3 h-3" />
            System
          </Badge>
        );
      case 'MAINTENANCE':
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 gap-1.5 font-medium py-0.5">
            <Wrench className="w-3 h-3" />
            Maintenance
          </Badge>
        );
      case 'SECURITY':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 gap-1.5 font-medium py-0.5">
            <ShieldAlert className="w-3 h-3" />
            Security
          </Badge>
        );
      case 'UPDATE':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5 font-medium py-0.5">
            <Sparkles className="w-3 h-3" />
            Update
          </Badge>
        );
      case 'WARNING':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1.5 font-medium py-0.5">
            <AlertTriangle className="w-3 h-3" />
            Warning
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1.5 font-medium py-0.5">
            <Bell className="w-3 h-3" />
            {type}
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all">
      <div className="overflow-x-auto w-full">
        <Table className="min-w-[700px]">
          <TableHeader className="bg-muted/40 border-b border-border/50">
            <TableRow className="hover:bg-transparent">
              <SortableTableHead 
                label="Type" 
                sortKey="type" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
                className="w-[140px] pl-6"
              />
              <TableHead className="w-[30%] min-w-[200px]">Notification Title</TableHead>
              <TableHead className="min-w-[170px]">Target Audience</TableHead>
              <SortableTableHead 
                label="Status" 
                sortKey="status" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
                className="w-[120px]"
              />
              <SortableTableHead 
                label="Dispatched" 
                sortKey="createdAt" 
                currentSortBy={sortBy} 
                currentSortOrder={sortOrder} 
                onSort={onSort || (() => {})} 
                className="w-[160px]"
              />
              <TableHead className="text-right pr-6 w-[80px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow
                key={notification.id}
                className="group hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/30 last:border-0"
                onClick={() => onViewDetails(notification)}
              >
                <TableCell className="pl-6 py-4">
                  {renderTypeBadge(notification.type)}
                </TableCell>
                <TableCell className="font-medium py-4">
                  <div className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {notification.title}
                  </div>
                  {notification.message && (
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-sm">
                      {notification.message}
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <div className="text-xs">
                    {notification.workspace ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[140px] text-foreground font-medium" title={notification.workspace.name}>
                          {notification.workspace.name}
                        </span>
                      </div>
                    ) : notification.user ? (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate max-w-[140px] text-foreground font-medium" title={notification.user.name || notification.user.email}>
                          {notification.user.name || notification.user.email}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-medium text-[11px] gap-1">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        Broadcast (All)
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  {notification.isRead ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Read
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      Delivered
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground py-4">
                  {format(new Date(notification.createdAt), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell className="text-right pr-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg opacity-80 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={() => onViewDetails(notification)}
                    title="View Full Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
