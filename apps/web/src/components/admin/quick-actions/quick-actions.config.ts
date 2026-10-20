import { 
  CreditCard, 
  UserPlus, 
  BellRing, 
  Flag, 
  Settings, 
  FileSearch 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface QuickActionConfig {
  key: string;
  label: string;
  description: string;
  permission: string;
  route: string;
  icon: LucideIcon;
}

export const adminQuickActions: QuickActionConfig[] = [
  {
    key: 'create-plan',
    label: 'Create Plan',
    description: 'Create a new subscription plan',
    permission: 'platform.plans.manage',
    route: '/admin/plans',
    icon: CreditCard,
  },
  {
    key: 'create-admin',
    label: 'Create Admin',
    description: 'Manage platform administrators',
    permission: 'platform.administrators.manage',
    route: '/admin/administrators',
    icon: UserPlus,
  },
  {
    key: 'broadcast-notification',
    label: 'Broadcast Notification',
    description: 'Send a platform-wide notification',
    permission: 'platform.notifications.manage',
    route: '/admin/notifications',
    icon: BellRing,
  },
  {
    key: 'feature-flags',
    label: 'Manage Feature Flags',
    description: 'Control platform feature availability',
    permission: 'platform.feature_flags.manage',
    route: '/admin/feature-flags',
    icon: Flag,
  },
  {
    key: 'system-settings',
    label: 'System Settings',
    description: 'Manage global NexaSocial settings',
    permission: 'platform.settings.manage',
    route: '/admin/settings',
    icon: Settings,
  },
  {
    key: 'audit-logs',
    label: 'View Audit Logs',
    description: 'Review administrative and security activity',
    permission: 'platform.audit_logs.view',
    route: '/admin/audit-logs',
    icon: FileSearch,
  }
];
