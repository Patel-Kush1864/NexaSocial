'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { userService } from '@/services/user.service';
import { updateProfileSchema, type UpdateProfileFormValues } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function ProfileForm() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      timezone: user?.timezone || 'UTC',
    },
  });

  const onSubmit = async (data: UpdateProfileFormValues) => {
    try {
      await userService.updateProfile(data);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await userService.uploadAvatar(file);
      toast.success('Avatar updated successfully');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-accent/20 border border-border/40">
        <Avatar className="h-16 w-16 border-2 border-primary/30">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1.5">
          <h4 className="text-sm font-bold">Profile Picture</h4>
          <div className="flex items-center gap-3">
            <Label
              htmlFor="avatar-input"
              className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1.5" />
              )}
              Upload Photo
            </Label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <span className="text-[11px] text-muted-foreground">
              JPG, PNG or GIF. Max 5MB.
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prof-first">First Name</Label>
          <Input id="prof-first" {...form.register('firstName')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prof-last">Last Name</Label>
          <Input id="prof-last" {...form.register('lastName')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prof-bio">Bio</Label>
        <textarea
          id="prof-bio"
          rows={3}
          placeholder="Tell your team about yourself..."
          {...form.register('bio')}
          className="w-full p-3 rounded-md bg-background border border-input text-xs font-medium focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prof-tz">Timezone</Label>
        <select
          id="prof-tz"
          {...form.register('timezone')}
          className="w-full h-10 px-3 rounded-md bg-background border border-input text-xs font-medium focus:ring-1 focus:ring-primary"
        >
          <option value="UTC">UTC (Coordinated Universal Time)</option>
          <option value="EST">EST (Eastern Standard Time)</option>
          <option value="PST">PST (Pacific Standard Time)</option>
          <option value="IST">IST (Indian Standard Time)</option>
        </select>
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
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
