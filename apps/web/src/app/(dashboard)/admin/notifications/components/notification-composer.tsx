'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Send,
  Eye,
  BellRing,
  Megaphone,
  Cpu,
  Wrench,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Users,
  Building2,
  UserCheck,
  Layers,
  FileText,
  MessageSquare,
  Radio,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePreviewAdminNotification, useSendAdminNotification } from '@/hooks/use-admin';
import { BroadcastConfirmationDialog } from './broadcast-confirmation-dialog';

const formSchema = z.object({
  type: z.enum(['SYSTEM', 'MAINTENANCE', 'SECURITY', 'ANNOUNCEMENT', 'UPDATE', 'WARNING']),
  targetType: z.enum(['ALL_USERS', 'ALL_WORKSPACES', 'SPECIFIC_USER', 'SPECIFIC_WORKSPACE']),
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  message: z.string().min(1, 'Message is required').max(2000, 'Message cannot exceed 2000 characters'),
  targetUserId: z.string().optional(),
  targetWorkspaceId: z.string().optional(),
}).refine((data) => {
  if (data.targetType === 'SPECIFIC_USER' && !data.targetUserId?.trim()) return false;
  if (data.targetType === 'SPECIFIC_WORKSPACE' && !data.targetWorkspaceId?.trim()) return false;
  return true;
}, {
  message: 'Target ID is required for specific recipients',
  path: ['targetUserId'],
});

interface NotificationComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_CONFIG = {
  ANNOUNCEMENT: {
    label: 'Announcement',
    icon: Megaphone,
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    dotColor: 'bg-purple-500',
  },
  SYSTEM: {
    label: 'System',
    icon: Cpu,
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dotColor: 'bg-blue-500',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    icon: Wrench,
    badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    dotColor: 'bg-orange-500',
  },
  SECURITY: {
    label: 'Security Alert',
    icon: ShieldAlert,
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    dotColor: 'bg-rose-500',
  },
  UPDATE: {
    label: 'Feature Update',
    icon: Sparkles,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dotColor: 'bg-emerald-500',
  },
  WARNING: {
    label: 'Warning',
    icon: AlertTriangle,
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dotColor: 'bg-amber-500',
  },
} as const;

export function NotificationComposer({ open, onOpenChange }: NotificationComposerProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'ANNOUNCEMENT',
      targetType: 'ALL_USERS',
      title: '',
      message: '',
      targetUserId: '',
      targetWorkspaceId: '',
    },
  });

  const { watch, reset, handleSubmit } = form;
  const targetType = watch('targetType');
  const notificationType = watch('type');
  const titleValue = watch('title') || '';
  const messageValue = watch('message') || '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [previewData, setPreviewData] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutateAsync: previewNotification, isPending: isPreviewing } = usePreviewAdminNotification();
  const { mutateAsync: sendNotification, isPending: isSending } = useSendAdminNotification();

  const isBroadcast = ['ALL_USERS', 'ALL_WORKSPACES'].includes(targetType);
  const activeTypeConfig = TYPE_CONFIG[notificationType] || TYPE_CONFIG.ANNOUNCEMENT;
  const TypeIcon = activeTypeConfig.icon;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        type: values.type,
        targetType: values.targetType,
        title: values.title.trim(),
        message: values.message.trim(),
        targetUserId: values.targetUserId?.trim() || undefined,
        targetWorkspaceId: values.targetWorkspaceId?.trim() || undefined,
      };

      if (isBroadcast) {
        const preview = await previewNotification(payload);
        setPreviewData(preview);
        setShowConfirm(true);
      } else {
        await sendNotification(payload);
        toast.success('Notification dispatched successfully');
        reset();
        onOpenChange(false);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to dispatch notification');
    }
  };

  const handleConfirmBroadcast = async () => {
    try {
      if (!previewData) return;
      const values = form.getValues();
      await sendNotification({
        type: values.type,
        targetType: values.targetType,
        title: values.title.trim(),
        message: values.message.trim(),
      });
      toast.success('Broadcast dispatched to recipients');
      setShowConfirm(false);
      reset();
      onOpenChange(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to dispatch broadcast');
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-[560px] p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-border/50 bg-card/60 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 shrink-0">
                <BellRing className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Send Notification</h2>
                  <Badge variant="outline" className={activeTypeConfig.badgeColor}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeTypeConfig.dotColor} mr-1.5 animate-pulse`} />
                    {activeTypeConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compose and dispatch platform announcements, alerts, or targeted messages.
                </p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form
            id="notification-composer-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {/* Notification Type */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Notification Type</span>
                <span className="text-muted-foreground/60 text-[11px] font-normal lowercase">determines urgency & icon</span>
              </Label>
              <Select
                value={notificationType}
                onValueChange={(val) => form.setValue('type', (val || 'ANNOUNCEMENT') as never)}
              >
                <SelectTrigger className="w-full h-11 bg-card/50 border-border/60 hover:border-primary/40 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-md border-border/80">
                  <SelectItem value="ANNOUNCEMENT">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <Megaphone className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Announcement</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SYSTEM">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">System Update</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="UPDATE">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">New Feature</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MAINTENANCE">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-400 flex items-center justify-center">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Scheduled Maintenance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="WARNING">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Warning Notice</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SECURITY">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">Security Alert</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-xs text-destructive font-medium">{form.formState.errors.type.message}</p>
              )}
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Target Audience</span>
                {isBroadcast && (
                  <span className="text-primary text-[11px] font-semibold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Broadcast Mode
                  </span>
                )}
              </Label>
              <Select
                value={targetType}
                onValueChange={(val) => {
                  form.setValue('targetType', (val || 'ALL_USERS') as never);
                  form.setValue('targetUserId', '');
                  form.setValue('targetWorkspaceId', '');
                }}
              >
                <SelectTrigger className="w-full h-11 bg-card/50 border-border/60 hover:border-primary/40 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-md border-border/80">
                  <SelectItem value="ALL_USERS">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium">All Users</div>
                        <div className="text-[11px] text-muted-foreground">Broadcast to all registered platform users</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="ALL_WORKSPACES">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-medium">All Workspaces</div>
                        <div className="text-[11px] text-muted-foreground">Broadcast to members of all workspaces</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="SPECIFIC_USER">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-medium">Specific User</div>
                        <div className="text-[11px] text-muted-foreground">Dispatch to an individual user by ID</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="SPECIFIC_WORKSPACE">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-medium">Specific Workspace</div>
                        <div className="text-[11px] text-muted-foreground">Dispatch to a specific workspace by ID</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.targetType && (
                <p className="text-xs text-destructive font-medium">{form.formState.errors.targetType.message}</p>
              )}
            </div>

            {/* Conditional Specific Target ID */}
            {targetType === 'SPECIFIC_USER' && (
              <div className="space-y-2 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 animate-in fade-in duration-300">
                <Label className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  Target User ID
                </Label>
                <Input
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  {...form.register('targetUserId')}
                  className="bg-background/80 border-blue-500/30 focus-visible:ring-blue-500/30 font-mono text-xs"
                />
                {form.formState.errors.targetUserId && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.targetUserId.message}</p>
                )}
              </div>
            )}

            {targetType === 'SPECIFIC_WORKSPACE' && (
              <div className="space-y-2 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 animate-in fade-in duration-300">
                <Label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Target Workspace ID
                </Label>
                <Input
                  placeholder="e.g. 2be7a989-f9dd-478c-94fe-62fa7dde4e85"
                  {...form.register('targetWorkspaceId')}
                  className="bg-background/80 border-amber-500/30 focus-visible:ring-amber-500/30 font-mono text-xs"
                />
                {form.formState.errors.targetWorkspaceId && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.targetWorkspaceId.message}</p>
                )}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Notification Title
                </Label>
                <span className={`text-[11px] font-mono ${titleValue.length > 200 ? 'text-amber-500' : 'text-muted-foreground/60'}`}>
                  {titleValue.length}/255
                </span>
              </div>
              <Input
                placeholder="e.g., Scheduled System Maintenance Window"
                {...form.register('title')}
                className="h-11 bg-card/50 border-border/60 hover:border-primary/40 focus:ring-primary/20 transition-all font-medium"
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive font-medium">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message Content
                </Label>
                <span className={`text-[11px] font-mono ${messageValue.length > 1800 ? 'text-amber-500' : 'text-muted-foreground/60'}`}>
                  {messageValue.length}/2000
                </span>
              </div>
              <textarea
                {...form.register('message')}
                className="flex min-h-[140px] w-full rounded-xl border border-border/60 bg-card/50 p-3 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all resize-none leading-relaxed"
                placeholder="Enter the full notification message for users..."
              />
              {form.formState.errors.message && (
                <p className="text-xs text-destructive font-medium">{form.formState.errors.message.message}</p>
              )}
            </div>

            {/* Live Interactive Preview Card */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                Live Inbox Preview
              </Label>
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 to-card/40 p-4 shadow-sm backdrop-blur-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-card border flex items-center justify-center text-primary">
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {activeTypeConfig.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Just now</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                    {titleValue.trim() || 'Notification Title Preview'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {messageValue.trim() || 'Your notification content will appear here exactly as recipients will see it.'}
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Sticky Footer */}
          <div className="p-4 sm:p-5 border-t border-border/50 bg-card/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              {isBroadcast ? (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  Broadcast Confirmation Required
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-muted text-muted-foreground font-medium">
                  Direct Dispatch
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="notification-composer-form"
                disabled={isPreviewing || isSending}
                className="h-10 px-5 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-violet-500/20 transition-all"
              >
                {isBroadcast ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Review Broadcast
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <BroadcastConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        previewData={previewData}
        onConfirm={handleConfirmBroadcast}
        isSending={isSending}
      />
    </>
  );
}
