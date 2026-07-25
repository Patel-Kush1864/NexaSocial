import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '../../workspace-members/entities/workspace-member.entity';

export const WORKSPACE_ROLES_KEY = 'workspace_roles';

export const RequireWorkspaceRole = (...roles: WorkspaceRole[]) =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);
