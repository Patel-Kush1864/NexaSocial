'use client';

import type { Notification } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Check,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  ShieldAlert,
  UserPlus,
  CreditCard,
  Radio,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
      case 'PAYMENT_SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'STREAM_STARTED':
      case 'STREAM_ENDED':
        return <Radio className="w-5 h-5 text-indigo-400" />;
      case 'WARNING':
      case 'STREAM_FAILED':
      case 'PAYMENT_FAILURE':
      case 'OAUTH_TOKEN_EXPIRED':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'ANNOUNCEMENT':
      case 'UPDATE':
      case 'SYSTEM':
      case 'MAINTENANCE':
        return <Megaphone className="w-5 h-5 text-violet-400" />;
      case 'SECURITY':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'WORKSPACE_INVITATION':
      case 'MEMBER_JOINED':
      case 'MEMBER_REMOVED':
        return <UserPlus className="w-5 h-5 text-cyan-400" />;
      case 'SUBSCRIPTION_RENEWAL':
        return <CreditCard className="w-5 h-5 text-violet-400" />;
      default:
        return <Info className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <Card
      className={`glass-panel border-border/40 transition-all ${
        !notification.isRead ? 'bg-primary/5 border-primary/40' : ''
      }`}
    >
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-accent/40 shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold leading-none">{notification.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {notification.message}
            </p>
            <p className="text-[10px] text-muted-foreground/70 pt-1">
              {formatRelativeTime(notification.createdAt || (notification as any).created_at, { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMarkRead(notification.id)}
              className="h-8 w-8 text-muted-foreground hover:text-primary"
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(notification.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
