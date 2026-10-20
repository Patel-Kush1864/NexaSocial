'use client';

import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, Clock, Calendar, CheckCircle, Target, Users, LayoutDashboard } from 'lucide-react';

interface NotificationDetailsDrawerProps {
  notification: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDetailsDrawer({
  notification,
  open,
  onOpenChange,
}: NotificationDetailsDrawerProps) {
  if (!notification) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px] p-0 flex flex-col h-full bg-background/95 backdrop-blur-sm border-l">
        <div className="p-6 border-b bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="font-semibold px-2.5 py-0.5">
              {notification.type}
            </Badge>
            {notification.isRead ? (
              <Badge variant="outline" className="bg-green-100/50 text-green-700 border-green-200">
                Read
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-100/50 text-blue-700 border-blue-200">
                Unread
              </Badge>
            )}
          </div>
          <h2 className="text-xl leading-tight font-semibold">
            {notification.title}
          </h2>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Sent {format(new Date(notification.createdAt), 'PPp')}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Target className="h-4 w-4 text-primary" />
                Target Information
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 border">
                {notification.workspace ? (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Workspace</span>
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{notification.workspace.name}</span>
                    </div>
                  </div>
                ) : notification.user ? (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">User</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{notification.user.name}</span>
                        <span className="text-xs text-muted-foreground">{notification.user.email}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Broadcast</span>
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <Bell className="h-4 w-4" />
                      Platform-Wide Delivery
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                Message Content
              </h4>
              <div className="bg-card border rounded-lg p-4 shadow-sm text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {notification.message}
              </div>
            </div>

            <Separator />
            
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                Delivery Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3 border space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Priority</span>
                  <div className="font-semibold text-sm">{notification.priority}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 border space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">System ID</span>
                  <div className="font-mono text-xs text-muted-foreground truncate" title={notification.id}>{notification.id}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
