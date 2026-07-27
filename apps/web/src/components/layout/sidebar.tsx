'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar-store';
import { DASHBOARD_NAV_ITEMS } from '@/lib/constants';
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
};

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();

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
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] || LayoutDashboard;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group relative',
                isActive
                  ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-primary border border-primary/30 font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
                isCollapsed && 'justify-center px-0',
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'group-hover:text-foreground',
                )}
              />
              {!isCollapsed && <span>{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 rounded-md bg-popover text-popover-foreground text-xs font-semibold shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Pro Card */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/20 space-y-3">
          <div className="flex items-center gap-2 text-violet-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Upgrade to Pro
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Unlock unlimited social channels and 4K multi-destination streaming.
          </p>
          <Button
            asChild
            size="sm"
            className="w-full h-8 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold"
          >
            <Link href="/billing">Upgrade Now</Link>
          </Button>
        </div>
      )}
    </aside>
  );
}
