'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { getVisibleNavigation } from '@/config/navigation';
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
  Repeat: Activity, // Fallback
  Wallet: CreditCard, // Fallback
};

import { Lock } from 'lucide-react';
import { useSubscriptionEntitlements } from '@/hooks/use-entitlements';
import { toast } from 'sonner';

export function MobileSidebar() {
  const pathname = usePathname();
  const { isMobileOpen, setMobileOpen } = useSidebarStore();
  const { scope, hasPermission } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { hasActiveSubscription, isWorkspaceOwner } = useSubscriptionEntitlements();

  const isPendingOnboarding = !hasActiveSubscription && !currentWorkspace;

  const isRouteLocked = (href: string) => {
    if (scope === 'PLATFORM') return false;
    if (hasActiveSubscription) return false;
    if (isPendingOnboarding) return false; // Allow navigation to display onboarding guard
    const allowed = ['/dashboard', '/billing', '/settings', '/notifications'];
    return !allowed.some((allowedPath) => href === allowedPath || href.startsWith(`${allowedPath}/`));
  };

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

          <nav className="space-y-4 overflow-y-auto">
            {getVisibleNavigation({ scope, hasPermission }).map((section) => (
              <div key={section.id} className="space-y-1">
                {section.label && (
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
                        setMobileOpen(false);
                        if (locked) {
                          e.preventDefault();
                          toast.info('Feature Locked', {
                            description: isWorkspaceOwner
                              ? 'Choose a subscription plan to unlock NexaSocial features.'
                              : 'This workspace does not currently have an active subscription. Please contact the workspace owner.',
                          });
                        }
                      }}
                      className={cn(
                        'flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all',
                        isActive && !locked
                          ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-primary border border-primary/30 font-semibold'
                          : locked
                            ? 'text-muted-foreground/50 hover:bg-muted/30 cursor-not-allowed'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            'w-5 h-5 shrink-0 transition-colors',
                            isActive && !locked ? 'text-primary' : 'text-muted-foreground',
                            locked && 'opacity-60',
                          )}
                        />
                        <span className={cn(locked && 'opacity-70')}>{item.label}</span>
                      </div>
                      {locked && <Lock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
