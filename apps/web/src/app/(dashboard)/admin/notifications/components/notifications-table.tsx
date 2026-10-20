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
import { Eye, Bell } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { SortableTableHead } from '@/components/admin/shared/sortable-table-head';

interface NotificationsTableProps {
  notifications: any[];
  isLoading: boolean;
  onViewDetails: (notification: any) => void;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function NotificationsTable({
  notifications,
  isLoading,
  onViewDetails,
  onSort,
  sortBy,
  sortOrder,
}: NotificationsTableProps) {
  if (isLoading) {
    return <LoadingSpinner size="lg" label="Loading notification history..." />;
  }

  if (!notifications?.length) {
    return (
      <EmptyState
        icon={Bell}
        title="No Notifications Found"
        description="You haven't dispatched any platform notifications yet."
      />
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SYSTEM': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'SECURITY': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'ANNOUNCEMENT': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'UPDATE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="rounded-md border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <SortableTableHead 
              label="Type" 
              sortKey="type" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <TableHead className="w-[30%]">Title</TableHead>
            <TableHead>Target</TableHead>
            <SortableTableHead 
              label="Status" 
              sortKey="status" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <SortableTableHead 
              label="Created At" 
              sortKey="createdAt" 
              currentSortBy={sortBy} 
              currentSortOrder={sortOrder} 
              onSort={onSort || (() => {})} 
            />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notification) => (
            <TableRow key={notification.id} className="group hover:bg-muted/50 transition-colors">
              <TableCell>
                <Badge variant="outline" className={`font-semibold ${getTypeColor(notification.type)}`}>
                  {notification.type}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                <div className="line-clamp-1">{notification.title}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {notification.workspace ? (
                    <div className="text-muted-foreground flex items-center gap-1">
                      <span className="font-medium text-foreground">Workspace:</span>
                      <span className="truncate max-w-[150px] block" title={notification.workspace.name}>{notification.workspace.name}</span>
                    </div>
                  ) : notification.user ? (
                    <div className="text-muted-foreground flex items-center gap-1">
                      <span className="font-medium text-foreground">User:</span>
                      <span className="truncate max-w-[150px] block" title={notification.user.name}>{notification.user.name}</span>
                    </div>
                  ) : (
                    <Badge variant="secondary">Broadcast</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {notification.isRead ? (
                  <Badge variant="outline" className="bg-green-100/50 text-green-700 border-green-200">Read</Badge>
                ) : (
                  <Badge variant="outline" className="bg-blue-100/50 text-blue-700 border-blue-200">Delivered</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(notification.createdAt), 'MMM d, yyyy HH:mm')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onViewDetails(notification)}
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
