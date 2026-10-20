import React from 'react';
import { Mail, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserStatusBadge } from '../UserStatusBadge';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

interface UserProfileHeaderProps {
  user: any;
  onActivate: () => void;
  onSuspend: () => void;
  onDeactivate: () => void;
  onChangeRole: () => void;
  canManage: boolean;
}

export function UserProfileHeader({
  user,
  onActivate,
  onSuspend,
  onDeactivate,
  onChangeRole,
  canManage,
}: UserProfileHeaderProps) {
  const router = useRouter();

  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No Name Provided';
  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 rounded-xl border border-border/50 glass-panel">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0 border border-primary/20">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {name}
            <UserStatusBadge status={user.status} />
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> {user.role?.name || 'USER'}
            </span>
            <span>Joined: {dayjs(user.created_at).format('MMM D, YYYY')}</span>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={onChangeRole}>
            Change Role
          </Button>
          {user.status !== 'ACTIVE' && (
            <Button size="sm" onClick={onActivate}>
              Activate
            </Button>
          )}
          {user.status === 'ACTIVE' && (
            <Button variant="secondary" size="sm" onClick={onSuspend}>
              Suspend
            </Button>
          )}
          {user.status !== 'DEACTIVATED' && (
            <Button variant="destructive" size="sm" onClick={onDeactivate}>
              Deactivate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
