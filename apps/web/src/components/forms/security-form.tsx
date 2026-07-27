'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userService } from '@/services/user.service';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export function SecurityForm() {
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      form.reset();
    } catch {
      toast.error('Failed to change password');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sec-current">Current Password</Label>
        <Input id="sec-current" type="password" {...form.register('currentPassword')} />
        {form.formState.errors.currentPassword && (
          <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sec-new">New Password</Label>
        <Input id="sec-new" type="password" {...form.register('newPassword')} />
        {form.formState.errors.newPassword && (
          <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sec-confirm">Confirm New Password</Label>
        <Input id="sec-confirm" type="password" {...form.register('confirmNewPassword')} />
        {form.formState.errors.confirmNewPassword && (
          <p className="text-xs text-destructive">
            {form.formState.errors.confirmNewPassword.message}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-border/40">
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4 mr-2" />
              Update Password
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
