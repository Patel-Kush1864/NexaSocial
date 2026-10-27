import React from 'react';
import { User, Building2, CreditCard, Package, Share2, Radio, Activity as ActivityIcon, Bell } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { PlatformActivity } from '@/types';

dayjs.extend(relativeTime);

interface ActivityRowProps {
  activity: PlatformActivity;
  onClick?: () => void;
}

const getCategoryDetails = (category: string) => {
  switch (category) {
    case 'USER':
      return { icon: <User className="w-4 h-4 text-blue-500" />, bg: 'bg-blue-500/10', label: 'Users' };
    case 'WORKSPACE':
      return { icon: <Building2 className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-500/10', label: 'Workspaces' };
    case 'PAYMENT':
      return { icon: <CreditCard className="w-4 h-4 text-amber-500" />, bg: 'bg-amber-500/10', label: 'Payments' };
    case 'SUBSCRIPTION':
      return { icon: <Package className="w-4 h-4 text-purple-500" />, bg: 'bg-purple-500/10', label: 'Subscriptions' };
    case 'SOCIAL':
      return { icon: <Share2 className="w-4 h-4 text-rose-500" />, bg: 'bg-rose-500/10', label: 'Social' };
    case 'STREAM':
      return { icon: <Radio className="w-4 h-4 text-indigo-500" />, bg: 'bg-indigo-500/10', label: 'Streams' };
    case 'NOTIFICATIONS':
      return { icon: <Bell className="w-4 h-4 text-violet-500" />, bg: 'bg-violet-500/10', label: 'Notifications' };
    default:
      return { icon: <ActivityIcon className="w-4 h-4 text-slate-500" />, bg: 'bg-slate-500/10', label: 'General' };
  }
};

export function ActivityRow({ activity, onClick }: ActivityRowProps) {
  const details = getCategoryDetails(activity.module);

  // Generate description if missing but we have an action and metadata
  let description = activity.description;
  if (!description) {
    if (activity.action === 'WORKSPACE_CREATED' && activity.metadata?.name) {
      description = `Workspace "${activity.metadata.name}" created`;
    } else if (activity.action === 'PAYMENT_SUCCESS' && activity.metadata?.amount) {
      description = `Payment received ₹${activity.metadata.amount}`;
    } else if (activity.action === 'PAYMENT_RECEIVED' && activity.metadata?.amount) {
      description = `Payment received ${activity.metadata.currency === 'usd' ? '$' : '₹'}${activity.metadata.amount}`;
    } else if (activity.action === 'SUBSCRIPTION_ACTIVATED') {
      description = activity.metadata?.planName
        ? `${activity.metadata.planName} subscription activated`
        : 'Subscription activated';
    } else if (activity.action === 'STREAM_CREATED' && activity.metadata?.title) {
      description = `Stream "${activity.metadata.title}" created`;
    } else if (activity.action === 'STREAM_STARTED') {
      description = 'Live stream broadcast started';
    } else if (activity.action === 'STREAM_STOPPED') {
      description = activity.metadata?.durationSeconds
        ? `Live stream ended (${activity.metadata.durationSeconds}s)`
        : 'Live stream ended';
    } else if (activity.action === 'STREAM_DELETED' && activity.metadata?.title) {
      description = `Stream "${activity.metadata.title}" deleted`;
    } else if (activity.action === 'STREAM_UPDATED' && activity.metadata?.title) {
      description = `Stream "${activity.metadata.title}" updated`;
    } else {
      description = activity.action.replace(/_/g, ' ').toLowerCase();
      // Capitalize first letter
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }
  }

  return (
    <div 
      onClick={onClick}
      className={`flex items-start gap-4 p-3 hover:bg-accent/50 rounded-lg transition-colors border-b border-border/40 last:border-0 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`mt-0.5 p-2 rounded-full ${details.bg} flex-shrink-0`}>
        {details.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-medium text-muted-foreground bg-accent px-1.5 py-0.5 rounded-sm">
            {details.label}
          </span>
          <span className="text-[11px] text-muted-foreground">•</span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {dayjs(activity.created_at).fromNow()}
          </span>
        </div>
      </div>
    </div>
  );
}
