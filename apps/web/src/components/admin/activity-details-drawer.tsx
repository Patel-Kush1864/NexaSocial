import React from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { PlatformActivity } from '@/types';
import dayjs from 'dayjs';
import { User, Building2, CreditCard, Package, Share2, Radio, Activity as ActivityIcon } from 'lucide-react';

interface ActivityDetailsDrawerProps {
  activity: PlatformActivity | null;
  isOpen: boolean;
  onClose: () => void;
}

const getCategoryDetails = (category: string) => {
  switch (category) {
    case 'USER':
      return { icon: <User className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-500/10', label: 'Users' };
    case 'WORKSPACE':
      return { icon: <Building2 className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-500/10', label: 'Workspaces' };
    case 'PAYMENT':
      return { icon: <CreditCard className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-500/10', label: 'Payments' };
    case 'SUBSCRIPTION':
      return { icon: <Package className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-500/10', label: 'Subscriptions' };
    case 'SOCIAL':
      return { icon: <Share2 className="w-5 h-5 text-rose-500" />, bg: 'bg-rose-500/10', label: 'Social' };
    case 'STREAM':
      return { icon: <Radio className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-500/10', label: 'Streams' };
    default:
      return { icon: <ActivityIcon className="w-5 h-5 text-slate-500" />, bg: 'bg-slate-500/10', label: 'General' };
  }
};

export function ActivityDetailsDrawer({ activity, isOpen, onClose }: ActivityDetailsDrawerProps) {
  if (!activity) return null;

  const details = getCategoryDetails(activity.module);
  
  let description = activity.description;
  if (!description) {
    if (activity.action === 'WORKSPACE_CREATED' && activity.metadata?.name) {
      description = `${activity.metadata.name} workspace created`;
    } else if (activity.action === 'PAYMENT_RECEIVED' && activity.metadata?.amount) {
      description = `Payment received ${activity.metadata.currency === 'usd' ? '$' : '₹'}${activity.metadata.amount}`;
    } else {
      description = activity.action.replace(/_/g, ' ').toLowerCase();
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto glass-panel p-6">
        <div className="mb-6 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${details.bg}`}>
              {details.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold">Activity Details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {dayjs(activity.created_at).format('MMM D, YYYY h:mm A')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* General Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">General</h4>
            
            <div className="bg-accent/30 rounded-xl p-4 space-y-3 border border-border/40">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Event Type</p>
                <p className="text-sm font-medium">{activity.action}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <span className="text-xs font-medium text-foreground bg-accent px-2 py-1 rounded-md">
                  {details.label}
                </span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm font-medium">{description}</p>
              </div>
            </div>
          </div>

          {/* Actor & Target Context */}
          {(activity.user || activity.workspace || activity.entityType) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Context</h4>
              
              <div className="bg-accent/30 rounded-xl p-4 space-y-3 border border-border/40">
                {activity.user && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Actor (User)</p>
                    <p className="text-sm font-medium">{activity.user.name}</p>
                    <p className="text-xs text-muted-foreground">{activity.user.email}</p>
                  </div>
                )}
                
                {activity.workspace && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Workspace</p>
                    <p className="text-sm font-medium">{activity.workspace.name}</p>
                  </div>
                )}

                {activity.entityType && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Target</p>
                    <p className="text-sm font-medium">{activity.entityType} {activity.entityId ? `(#${activity.entityId})` : ''}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Metadata</h4>
              
              <div className="bg-accent/30 rounded-xl p-4 border border-border/40 overflow-x-auto">
                <pre className="text-xs text-muted-foreground font-mono">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
