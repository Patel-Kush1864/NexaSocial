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

import { Button } from '@/components/ui/button';
import { Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { usePreviewAdminNotification, useSendAdminNotification } from '@/hooks/use-admin';
import { BroadcastConfirmationDialog } from './broadcast-confirmation-dialog';

const formSchema = z.object({
  type: z.enum(['SYSTEM', 'MAINTENANCE', 'SECURITY', 'ANNOUNCEMENT', 'UPDATE', 'WARNING']),
  targetType: z.enum(['ALL_USERS', 'ALL_WORKSPACES', 'SPECIFIC_USER', 'SPECIFIC_WORKSPACE']),
  title: z.string().min(1, 'Title is required').max(255),
  message: z.string().min(1, 'Message is required').max(2000),
  targetUserId: z.string().optional(),
  targetWorkspaceId: z.string().optional(),
}).refine((data) => {
  if (data.targetType === 'SPECIFIC_USER' && !data.targetUserId) return false;
  if (data.targetType === 'SPECIFIC_WORKSPACE' && !data.targetWorkspaceId) return false;
  return true;
}, {
  message: 'Target ID is required for specific targets',
  path: ['targetUserId'],
});

interface NotificationComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  // eslint-disable-next-line react-hooks/incompatible-library
  const targetType = watch('targetType');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [previewData, setPreviewData] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutateAsync: previewNotification, isPending: isPreviewing } = usePreviewAdminNotification();
  const { mutateAsync: sendNotification, isPending: isSending } = useSendAdminNotification();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const isBroadcast = ['ALL_USERS', 'ALL_WORKSPACES'].includes(values.targetType);

      const payload = {
        type: values.type,
        targetType: values.targetType,
        title: values.title,
        message: values.message,
        targetUserId: values.targetUserId || undefined,
        targetWorkspaceId: values.targetWorkspaceId || undefined,
      };

      if (isBroadcast) {
        const preview = await previewNotification(payload);
        setPreviewData(preview);
        setShowConfirm(true);
      } else {
        await sendNotification(payload);
        toast.success('Notification sent successfully');
        reset();
        onOpenChange(false);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process notification');
    }
  };

  const handleConfirmBroadcast = async () => {
    try {
      if (!previewData) return;
      const values = form.getValues();
      await sendNotification({
        type: values.type,
        targetType: values.targetType,
        title: values.title,
        message: values.message,
      });
      toast.success('Broadcast dispatched successfully');
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
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <div className="flex flex-col space-y-1 mt-4">
            <h2 className="text-lg font-semibold text-foreground">Send Notification</h2>
            <p className="text-sm text-muted-foreground">
              Create and dispatch platform notifications.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-1.5">
                <Label>Notification Type</Label>
                <Select
                  onValueChange={(val) => form.setValue('type', val as never)}
                  defaultValue={form.getValues('type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYSTEM">System</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                    <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Target Audience</Label>
                <Select
                  onValueChange={(val) => {
                    form.setValue('targetType', val as never);
                    form.setValue('targetUserId', '');
                    form.setValue('targetWorkspaceId', '');
                  }}
                  defaultValue={form.getValues('targetType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_USERS">All Users</SelectItem>
                    <SelectItem value="ALL_WORKSPACES">All Workspaces</SelectItem>
                    <SelectItem value="SPECIFIC_USER">Specific User</SelectItem>
                    <SelectItem value="SPECIFIC_WORKSPACE">Specific Workspace</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.targetType && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.targetType.message}</p>
                )}
              </div>

              {targetType === 'SPECIFIC_USER' && (
                <div className="space-y-1.5">
                  <Label>Target User ID</Label>
                  <Input placeholder="Enter user ID..." {...form.register('targetUserId')} />
                  {form.formState.errors.targetUserId && (
                    <p className="text-xs text-destructive font-medium">{form.formState.errors.targetUserId.message}</p>
                  )}
                </div>
              )}

              {targetType === 'SPECIFIC_WORKSPACE' && (
                <div className="space-y-1.5">
                  <Label>Target Workspace ID</Label>
                  <Input placeholder="Enter workspace ID..." {...form.register('targetWorkspaceId')} />
                  {form.formState.errors.targetWorkspaceId && (
                    <p className="text-xs text-destructive font-medium">{form.formState.errors.targetWorkspaceId.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input placeholder="Notification title..." {...form.register('title')} />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Message</Label>
                <textarea
                  {...form.register('message')}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Notification content..."
                />
                {form.formState.errors.message && (
                  <p className="text-xs text-destructive font-medium">{form.formState.errors.message.message}</p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPreviewing || isSending}
                  className="gap-2"
                >
                  {['ALL_USERS', 'ALL_WORKSPACES'].includes(targetType) ? (
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
            </form>
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
