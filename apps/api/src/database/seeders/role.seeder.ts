import { DataSource } from 'typeorm';
import { Role } from '../../users/entities/role.entity';
import { Permission } from '../../users/entities/permission.entity';

const PLATFORM_PERMISSIONS = [
  'platform.dashboard.view',
  'platform.users.view',
  'platform.users.manage',
  'platform.workspaces.view',
  'platform.workspaces.manage',
  'platform.roles.view',
  'platform.roles.manage',
  'platform.plans.view',
  'platform.plans.manage',
  'platform.subscriptions.view',
  'platform.subscriptions.manage',
  'platform.payments.view',
  'platform.payments.manage',
  'platform.social_platforms.view',
  'platform.social_platforms.manage',
  'platform.connected_accounts.view',
  'platform.livestreams.view',
  'platform.livestreams.manage',
  'platform.notifications.view',
  'platform.notifications.manage',
  'platform.activity.view',
  'platform.reports.view',
  'platform.reports.export',
  'platform.audit_logs.view',
  'platform.security.view',
  'platform.administrators.view',
  'platform.administrators.manage',
  'platform.feature_flags.view',
  'platform.feature_flags.manage',
  'platform.settings.view',
  'platform.settings.manage',
  'platform.system_health.view',
];

const SHARED_PERMISSIONS = ['dashboard.view'];

const WORKSPACE_PERMISSIONS = [
  'workspace.view',
  'workspace.manage',
  'workspace.members.view',
  'workspace.members.manage',
  'workspace.social_accounts.view',
  'workspace.social_accounts.manage',
  'workspace.livestreams.view',
  'workspace.livestreams.manage',
  'workspace.content.view',
  'workspace.content.manage',
  'workspace.media.view',
  'workspace.media.manage',
  'workspace.analytics.view',
  'workspace.subscription.view',
  'workspace.subscription.manage',
  'workspace.notifications.view',
  'workspace.notifications.manage',
  'workspace.settings.view',
  'workspace.settings.manage',
];

export async function seedRolesAndPermissions(
  dataSource: DataSource,
): Promise<Role[]> {
  const permissionRepository = dataSource.getRepository(Permission);
  const roleRepository = dataSource.getRepository(Role);

  // 1. Seed Permissions
  const allPermKeys = [
    ...SHARED_PERMISSIONS,
    ...PLATFORM_PERMISSIONS,
    ...WORKSPACE_PERMISSIONS,
  ];
  const seededPermissions: Record<string, Permission> = {};

  for (const key of allPermKeys) {
    let perm = await permissionRepository.findOneBy({ key });

    // Determine module from key (e.g. platform.users.manage -> users, workspace.manage -> workspace)
    const parts = key.split('.');
    const moduleName = parts.length > 2 ? parts[1] : parts[0];

    if (!perm) {
      perm = permissionRepository.create({
        key,
        name: parts
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' '),
        module: moduleName,
      });
      perm = await permissionRepository.save(perm);
    } else if (perm.module !== moduleName) {
      perm.module = moduleName;
      perm = await permissionRepository.save(perm);
    }
    seededPermissions[key] = perm;
  }

  // 2. Define Roles and their Permissions
  const rolesToSeed = [
    {
      name: 'WORKSPACE_OWNER',
      description: 'Workspace owner with full access',
      permissions: ['dashboard.view', ...WORKSPACE_PERMISSIONS],
    },
    {
      name: 'MANAGER',
      description: 'Workspace manager',
      permissions: [
        'dashboard.view',
        ...WORKSPACE_PERMISSIONS.filter((p) => p !== 'workspace.manage'),
      ],
    },
    {
      name: 'CREATOR',
      description: 'Workspace content creator',
      permissions: [
        'dashboard.view',
        'workspace.view',
        'workspace.livestreams.view',
        'workspace.livestreams.manage',
        'workspace.social_accounts.view',
      ],
    },
    {
      name: 'VIEWER',
      description: 'Workspace viewer',
      permissions: [
        'dashboard.view',
        'workspace.view',
        'workspace.members.view',
        'workspace.social_accounts.view',
        'workspace.livestreams.view',
      ],
    },
    {
      name: 'ADMIN',
      description: 'Administrative access',
      permissions: [
        'dashboard.view',
        'platform.dashboard.view',
        'platform.users.view',
        'platform.users.manage',
        'platform.workspaces.view',
        'platform.workspaces.manage',
        'platform.roles.view',
        'platform.plans.view',
        'platform.subscriptions.view',
        'platform.payments.view',
        'platform.social_platforms.view',
        'platform.social_platforms.manage',
        'platform.connected_accounts.view',
        'platform.livestreams.view',
        'platform.livestreams.manage',
        'platform.notifications.view',
        'platform.notifications.manage',
        'platform.activity.view',
        'platform.reports.view',
        'platform.reports.export',
        'platform.audit_logs.view',
        'platform.security.view',
        'platform.administrators.view',
        'platform.feature_flags.view',
        'platform.settings.view',
        'platform.system_health.view',
      ],
    },
    {
      name: 'SUPER_ADMIN',
      description: 'Full system administrative access',
      permissions: ['dashboard.view', ...PLATFORM_PERMISSIONS],
    },
  ];

  // 3. Seed Roles and map Permissions
  const seededRoles: Role[] = [];
  for (const roleData of rolesToSeed) {
    let role = await roleRepository.findOne({
      where: { name: roleData.name },
      relations: { permissions: true },
    });

    if (!role) {
      role = roleRepository.create({
        name: roleData.name,
        description: roleData.description,
      });
    }

    // Always update permissions during seed to ensure new permissions are applied
    role.permissions = roleData.permissions.map(
      (key) => seededPermissions[key],
    );
    role = await roleRepository.save(role);

    seededRoles.push(role);
  }

  return seededRoles;
}
