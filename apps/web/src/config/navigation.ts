import { Scope } from '@/types';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  scope: Scope;
  permission: string;
  isDashboard?: boolean;
}

export interface NavigationSection {
  id: string;
  label: string;
  items: NavigationItem[];
}

export const PLATFORM_NAVIGATION: NavigationSection[] = [
  {
    id: 'dashboard',
    label: '',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        scope: 'PLATFORM',
        permission: 'platform.dashboard.view',
        isDashboard: true,
      },
    ],
  },
  {
    id: 'platform',
    label: 'PLATFORM',
    items: [
      {
        id: 'users',
        label: 'Users',
        href: '/admin/users',
        icon: 'Users',
        scope: 'PLATFORM',
        permission: 'platform.users.view',
      },
      {
        id: 'workspaces',
        label: 'Workspaces',
        href: '/admin/workspaces',
        icon: 'Building2',
        scope: 'PLATFORM',
        permission: 'platform.workspaces.view',
      },
    ],
  },
  {
    id: 'business',
    label: 'BUSINESS',
    items: [
      {
        id: 'plans',
        label: 'Plans',
        href: '/admin/plans',
        icon: 'CreditCard',
        scope: 'PLATFORM',
        permission: 'platform.plans.view',
      },
      {
        id: 'subscriptions',
        label: 'Subscriptions',
        href: '/subscriptions',
        icon: 'Repeat',
        scope: 'PLATFORM',
        permission: 'platform.subscriptions.view',
      },
      {
        id: 'payments',
        label: 'Payments',
        href: '/admin/payments',
        icon: 'Wallet',
        scope: 'PLATFORM',
        permission: 'platform.payments.view',
      },
    ],
  },
  {
    id: 'social',
    label: 'SOCIAL & STREAMING',
    items: [
      {
        id: 'social-platforms',
        label: 'Social Platforms',
        href: '/social-platforms',
        icon: 'Globe',
        scope: 'PLATFORM',
        permission: 'platform.social_platforms.view',
      },
      {
        id: 'connected-accounts',
        label: 'Connected Accounts',
        href: '/connected-accounts',
        icon: 'Link',
        scope: 'PLATFORM',
        permission: 'platform.connected_accounts.view',
      },
      {
        id: 'live-streams',
        label: 'Live Streams',
        href: '/live-streams',
        icon: 'Radio',
        scope: 'PLATFORM',
        permission: 'platform.livestreams.view',
      },
    ],
  },
  {
    id: 'communication',
    label: 'COMMUNICATION',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/admin/notifications',
        icon: 'Bell',
        scope: 'PLATFORM',
        permission: 'platform.notifications.view',
      },
      {
        id: 'activity',
        label: 'Activity',
        href: '/admin/activity',
        icon: 'Activity',
        scope: 'PLATFORM',
        permission: 'platform.activity.view',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'ANALYTICS',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        href: '/admin/reports',
        icon: 'BarChart3',
        scope: 'PLATFORM',
        permission: 'platform.reports.view',
      },
    ],
  },
  {
    id: 'security',
    label: 'SECURITY',
    items: [
      {
        id: 'audit-logs',
        label: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: 'FileSearch',
        scope: 'PLATFORM',
        permission: 'platform.audit_logs.view',
      },
      {
        id: 'security',
        label: 'Security',
        href: '/admin/security',
        icon: 'Shield',
        scope: 'PLATFORM',
        permission: 'platform.security.view',
      },
      {
        id: 'administrators',
        label: 'Administrators',
        href: '/admin/administrators',
        icon: 'UserCog',
        scope: 'PLATFORM',
        permission: 'platform.administrators.view',
      },
    ],
  },
  {
    id: 'system',
    label: 'SYSTEM',
    items: [
      {
        id: 'feature-flags',
        label: 'Feature Flags',
        href: '/admin/feature-flags',
        icon: 'Flag',
        scope: 'PLATFORM',
        permission: 'platform.feature_flags.view',
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: 'Settings',
        scope: 'PLATFORM',
        permission: 'platform.settings.view',
      },
      {
        id: 'system-health',
        label: 'System Health',
        href: '/admin/system-health',
        icon: 'Activity',
        scope: 'PLATFORM',
        permission: 'platform.system_health.view',
      },
      {
        id: 'email-system',
        label: 'Email System',
        href: '/admin/email',
        icon: 'Mail',
        scope: 'PLATFORM',
        permission: 'platform.email.manage',
      },
    ],
  }
];

export const WORKSPACE_NAVIGATION: NavigationSection[] = [
  {
    id: 'dashboard',
    label: '',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        scope: 'WORKSPACE',
        permission: 'dashboard.view', // Keep existing if that's what's used
        isDashboard: true,
      }
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        id: 'team',
        label: 'Team',
        href: '/team',
        icon: 'Users',
        scope: 'WORKSPACE',
        permission: 'workspace.members.view',
      },
      {
        id: 'social-accounts',
        label: 'Social Accounts',
        href: '/social',
        icon: 'Share2',
        scope: 'WORKSPACE',
        permission: 'workspace.social_accounts.view',
      },
      {
        id: 'live-streams',
        label: 'Live Streams',
        href: '/streams',
        icon: 'Radio',
        scope: 'WORKSPACE',
        permission: 'workspace.livestreams.view',
      },
      {
        id: 'content',
        label: 'Content',
        href: '/content',
        icon: 'FileText',
        scope: 'WORKSPACE',
        permission: 'workspace.content.view',
      },
      {
        id: 'media',
        label: 'Media',
        href: '/media',
        icon: 'Image',
        scope: 'WORKSPACE',
        permission: 'workspace.media.view',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: 'BarChart3',
        scope: 'WORKSPACE',
        permission: 'workspace.analytics.view',
      },
      {
        id: 'subscription',
        label: 'Subscription',
        href: '/billing',
        icon: 'CreditCard',
        scope: 'WORKSPACE',
        permission: 'workspace.subscription.view',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/notifications',
        icon: 'Bell',
        scope: 'WORKSPACE',
        permission: 'workspace.notifications.view',
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: 'Settings',
        scope: 'WORKSPACE',
        permission: 'workspace.settings.view',
      },
    ]
  }
];

interface GetVisibleNavigationParams {
  scope: Scope | null;
  hasPermission: (permission: string) => boolean;
}

export function getVisibleNavigation({ scope, hasPermission }: GetVisibleNavigationParams): NavigationSection[] {
  if (!scope) return [];

  const sourceConfig = scope === 'PLATFORM' ? PLATFORM_NAVIGATION : WORKSPACE_NAVIGATION;

  const filteredSections = sourceConfig.map(section => {
    const visibleItems = section.items.filter(item => hasPermission(item.permission));
    
    return {
      ...section,
      items: visibleItems,
    };
  }).filter(section => section.items.length > 0);

  return filteredSections;
}
