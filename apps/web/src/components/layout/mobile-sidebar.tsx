'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar-store';
import { DASHBOARD_NAV_ITEMS } from '@/lib/constants';
import { WorkspaceSwitcher } from './workspace-switcher';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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

export function MobileSidebar() {
  const pathname = usePathname();
  const { isMobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 glass-panel p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/25">
              N
            </div>
            <span className="font-bold text-xl tracking-tight gradient-text">
              NexaSocial
            </span>
          </div>

          <WorkspaceSwitcher />

          <nav className="space-y-1">
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP] || LayoutDashboard;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-primary border border-primary/30 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
