'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useAuthStore } from '@/stores/auth-store';
import { getVisibleNavigation } from '@/config/navigation';
import { WorkspaceSwitcher } from './workspace-switcher';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Share2,
  Radio,
  BarChart3,
  Building2,
  Bell,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Package,
  Activity,
  Globe,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  FileSearch,
  Shield,
  UserCog,
  Flag,
  Mail,
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard,
  Share2,
  Radio,
  BarChart3,
  Building2,
  Bell,
  CreditCard,
  Settings,
  Users,
  Package,
  Activity,
  Globe,
  Link: LinkIcon,
  FileText,
  Image: ImageIcon,
  FileSearch,
  Shield,
  UserCog,
  Flag,
  Mail,
  Repeat: Activity, // Fallback
  Wallet: CreditCard, // Fallback
};

import { Lock } from 'lucide-react';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { toast } from 'sonner';

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();
  const { scope } = useAuthStore();
  const { hasActiveSubscription } = useSubscriptionEntitlements();

  const isRouteLocked = (href: string) => {
    if (scope === 'PLATFORM') return false;
    if (hasActiveSubscription) return false;
    // Allowed routes without subscription: dashboard, billing, settings, notifications
    const allowed = ['/dashboard', '/billing', '/settings', '/notifications'];
    return !allowed.some((allowedPath) => href === allowedPath || href.startsWith(`${allowedPath}/`));
  };

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col justify-between border-r border-border/50 bg-sidebar transition-all duration-300 relative z-20',
        isCollapsed ? 'w-20' : 'w-64',
      )}
    >
      {/* Top Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-violet-500/25">
              N
            </div>
            {!isCollapsed && (
              <span className="font-bold text-xl tracking-tight gradient-text">
                NexaSocial
              </span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hidden lg:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Workspace Switcher */}
        {!isCollapsed && <WorkspaceSwitcher />}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        {getVisibleNavigation({ scope, hasPermission: useAuthStore.getState().hasPermission }).map((section) => (
          <div key={section.id} className="space-y-1">
            {!isCollapsed && section.label && (
              <h4 className="px-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                {section.label}
              </h4>
            )}

            {section.items.map((item) => {
              const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] || LayoutDashboard;
              const isActive = pathname === item.href || (!item.isDashboard && pathname.startsWith(item.href));
              const locked = isRouteLocked(item.href);

              return (
                <Link
                  key={item.href}
                  href={locked ? '/dashboard' : item.href}
                  onClick={(e) => {
                    if (locked) {
                      e.preventDefault();
                      toast.info('Feature Locked', {
                        description: 'Choose a subscription plan to unlock NexaSocial features.',
                      });
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group relative',
                    isActive && !locked
                      ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-primary border border-primary/30 font-semibold shadow-sm'
                      : locked
                        ? 'text-muted-foreground/50 hover:bg-muted/30 cursor-not-allowed'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
                    isCollapsed && 'justify-center px-0',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0 transition-colors',
                      isActive && !locked ? 'text-primary' : 'group-hover:text-foreground',
                      locked && 'opacity-60',
                    )}
                  />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className={cn('truncate', locked && 'opacity-70')}>{item.label}</span>
                      {locked && (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/70 ml-2 shrink-0" />
                      )}
                    </div>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 rounded-md bg-popover text-popover-foreground text-xs font-semibold shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex items-center gap-1.5">
                      {item.label}
                      {locked && <Lock className="w-3 h-3 text-amber-400" />}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Pro / Locked Card */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/20 space-y-3">
          <div className="flex items-center gap-2 text-violet-400">
            {hasActiveSubscription ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  NexaSocial Pro
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Subscription Required
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {hasActiveSubscription
              ? 'Multi-destination broadcasting and AI tools active.'
              : 'Unlock unlimited live streaming, AI tools, and social channels.'}
          </p>
          <Button
            asChild
            size="sm"
            className="w-full h-8 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
          >
            <Link href="/billing">{hasActiveSubscription ? 'Manage Plan' : 'Subscribe Now'}</Link>
          </Button>
        </div>
      )}
    </aside>
  );
}
