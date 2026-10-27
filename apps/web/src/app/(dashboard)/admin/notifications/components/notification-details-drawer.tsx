'use client';

import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Target,
  Users,
  Building2,
  Copy,
  Check,
  Megaphone,
  Cpu,
  Wrench,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface NotificationDetailsDrawerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notification: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_MAP: Record<string, { label: string; icon: any; color: string; dot: string }> = {
  ANNOUNCEMENT: { label: 'Announcement', icon: Megaphone, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-500' },
  SYSTEM: { label: 'System', icon: Cpu, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
  MAINTENANCE: { label: 'Maintenance', icon: Wrench, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-500' },
  SECURITY: { label: 'Security Alert', icon: ShieldAlert, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
  UPDATE: { label: 'Feature Update', icon: Sparkles, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  WARNING: { label: 'Warning', icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
};

export function NotificationDetailsDrawer({
  notification,
  open,
  onOpenChange,
}: NotificationDetailsDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!notification) return null;

  const typeConfig = TYPE_MAP[notification.type] || {
    label: notification.type,
    icon: Bell,
    color: 'bg-secondary text-secondary-foreground border-border',
    dot: 'bg-primary',
  };
  const TypeIcon = typeConfig.icon;

  const handleCopyId = () => {
    if (notification?.id) {
      navigator.clipboard.writeText(notification.id);
      setCopied(true);
      toast.success('Notification ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border/50 bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={typeConfig.color}>
              <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot} mr-1.5`} />
              {typeConfig.label}
            </Badge>

            {notification.isRead ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Read
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                <AlertCircle className="w-3 h-3 mr-1" />
                Delivered (Unread)
              </Badge>
            )}

            {notification.priority && (
              <Badge variant="secondary" className="text-[11px] font-mono uppercase">
                {notification.priority}
              </Badge>
            )}
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground leading-snug">
            {notification.title}
          </h2>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Dispatched {format(new Date(notification.createdAt), 'PPp')}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Target Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" />
              Target Recipient
            </h4>

            <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3 shadow-sm">
              {notification.workspace ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Target Workspace</div>
                    <div className="text-sm font-semibold text-foreground">{notification.workspace.name}</div>
                  </div>
                </div>
              ) : notification.user ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Target User</div>
                    <div className="text-sm font-semibold text-foreground">{notification.user.name || 'User'}</div>
                    <div className="text-xs text-muted-foreground">{notification.user.email}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Delivery Scope</div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Platform Broadcast
                      <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                        All Users
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Message Content */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Notification Message
            </h4>
            <div className="rounded-xl border border-border/60 bg-card/50 p-4 shadow-sm text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {notification.message}
            </div>
          </div>

          <Separator className="bg-border/40" />

          {/* Delivery & System Meta */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Delivery Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/50 bg-card/30 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${notification.isRead ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  {notification.isRead ? 'Read by recipient' : 'Delivered to inbox'}
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/30 p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notification ID</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground truncate" title={notification.id}>
                    {notification.id}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleCopyId}
                    title="Copy ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-md flex items-center justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-5">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
