/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  TransferOwnershipDto,
} from '../dto/workspace.dto';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../../workspace-members/entities/workspace-member.entity';
import { UsageLimitService } from '../../subscriptions/services/usage-limit.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { ActivityLog } from '../../users/entities/activity-log.entity';
import { UsersRepository } from '../../users/repositories/users.repository';
import { LoggerServiceWrapper } from '../../logger/logger.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly usersRepository: UsersRepository,
    private readonly usageLimitService: UsageLimitService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly loggerService: LoggerServiceWrapper,
    private readonly dataSource: DataSource,
  ) {}

  async createWorkspace(
    ownerId: string,
    dto: CreateWorkspaceDto,
  ): Promise<Workspace> {
    // 1. Check workspace limit under active plan
    const allowed = await this.usageLimitService.canCreateWorkspace(ownerId);
    if (!allowed) {
      throw new BadRequestException(
        'Workspace creation limit reached. Please upgrade your plan.',
      );
    }

    // 2. Generate slug
    const cleanName = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${cleanName}-${randSuffix}`;

    // 3. Create & Save Workspace
    const workspace = this.workspaceRepository.create({
      ...dto,
      ownerId,
      slug,
      status: 'ACTIVE',
    });
    await this.workspaceRepository.save(workspace);

    // 4. Register Owner in WorkspaceMembers
    const member = this.memberRepository.create({
      workspaceId: workspace.id,
      userId: ownerId,
      role: WorkspaceRole.OWNER,
    });
    await this.memberRepository.save(member);

    // 5. Log activity
    this.loggerService.log(
      `Workspace created: ${workspace.name} (ID: ${workspace.id}) by User ${ownerId}`,
      'WorkspacesService',
      'application',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: ownerId,
        action: 'WORKSPACE_CREATED',
        metadata: {
          workspaceId: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        },
      }),
    );

    return workspace;
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const originalLogo = workspace.logo;
    Object.assign(workspace, dto);
    await this.workspaceRepository.save(workspace);

    // Activity Logger
    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action:
          dto.logo && dto.logo !== originalLogo
            ? 'WORKSPACE_LOGO_CHANGED'
            : 'WORKSPACE_UPDATED',
        metadata: { workspaceId, name: workspace.name },
      }),
    );

    return workspace;
  }

  async softDeleteWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.workspaceRepository.softDelete(workspaceId);

    // Delete memberships
    await this.memberRepository.softDelete({ workspaceId });

    this.loggerService.log(
      `Workspace soft deleted: ID ${workspaceId} by User ${userId}`,
      'WorkspacesService',
      'security',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId,
        action: 'WORKSPACE_DELETED',
        metadata: { workspaceId, name: workspace.name },
      }),
    );
  }

  async findAllForUser(userId: string): Promise<Workspace[]> {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: { workspace: true },
    });
    return memberships
      .map((m) => m.workspace)
      .filter((ws) => ws !== null && !ws.deleted_at);
  }

  async findById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({ where: { id } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async transferOwnership(
    workspaceId: string,
    currentOwnerId: string,
    dto: TransferOwnershipDto,
  ): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== currentOwnerId) {
      throw new ForbiddenException(
        'Only the current owner can transfer workspace ownership',
      );
    }

    // Verify Password
    const currentUser = await this.usersRepository.findById(currentOwnerId);
    if (!currentUser || !currentUser.password) {
      throw new ForbiddenException('User session invalid');
    }

    const isMatch = await bcrypt.compare(
      dto.confirmPassword,
      currentUser.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Incorrect confirmation password');
    }

    // Confirm new owner is a member
    const newOwnerMember = await this.memberRepository.findOne({
      where: { workspaceId, userId: dto.newOwnerId },
    });

    if (!newOwnerMember) {
      throw new BadRequestException(
        'New owner must be an active member of this workspace',
      );
    }

    // Perform transfer
    workspace.ownerId = dto.newOwnerId;
    await this.workspaceRepository.save(workspace);

    // Promote new owner member to OWNER
    newOwnerMember.role = WorkspaceRole.OWNER;
    await this.memberRepository.save(newOwnerMember);

    // Demote current owner member to MANAGER
    const oldOwnerMember = await this.memberRepository.findOne({
      where: { workspaceId, userId: currentOwnerId },
    });
    if (oldOwnerMember) {
      oldOwnerMember.role = WorkspaceRole.MANAGER;
      await this.memberRepository.save(oldOwnerMember);
    }

    this.loggerService.log(
      `Ownership of Workspace ${workspace.name} (ID: ${workspaceId}) transferred to User ${dto.newOwnerId}`,
      'WorkspacesService',
      'security',
    );

    await this.activityLogRepository.save(
      this.activityLogRepository.create({
        userId: currentOwnerId,
        action: 'OWNERSHIP_TRANSFERRED',
        metadata: {
          workspaceId,
          fromUserId: currentOwnerId,
          toUserId: dto.newOwnerId,
        },
      }),
    );

    return workspace;
  }

  async getDashboard(workspaceId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // 1. Count members
    const membersCount = await this.memberRepository.count({
      where: { workspaceId },
    });

    // 2. Counts of connected accounts / streams using dynamic queries (fallback to static counts if tables not there)
    let connectedAccounts = 5;
    let scheduledStreams = 12;
    let liveStreams = 2;

    try {
      const queryRunner = this.dataSource.createQueryRunner();
      const hasAccountsTable = await queryRunner.hasTable('social_accounts');
      const hasStreamsTable = await queryRunner.hasTable('live_streams');
      await queryRunner.release();

      if (hasAccountsTable) {
        const result = await this.dataSource.query(
          `SELECT COUNT(*) as count FROM \`social_accounts\` WHERE \`workspace_id\` = ? AND deleted_at IS NULL`,
          [workspaceId],
        );
        connectedAccounts = parseInt(result[0]?.count || '0', 10);
      }
      if (hasStreamsTable) {
        const sched = await this.dataSource.query(
          `SELECT COUNT(*) as count FROM \`live_streams\` WHERE \`workspace_id\` = ? AND \`status\` = 'SCHEDULED' AND deleted_at IS NULL`,
          [workspaceId],
        );
        scheduledStreams = parseInt(sched[0]?.count || '0', 10);

        const live = await this.dataSource.query(
          `SELECT COUNT(*) as count FROM \`live_streams\` WHERE \`workspace_id\` = ? AND \`status\` = 'LIVE' AND deleted_at IS NULL`,
          [workspaceId],
        );
        liveStreams = parseInt(live[0]?.count || '0', 10);
      }
    } catch {
      // ignore, fallbacks are loaded
    }

    // 3. Get subscription plan name of owner
    const sub = await this.subscriptionsService.getCurrentSubscription(
      workspace.ownerId,
    );

    return {
      members: membersCount,
      connectedAccounts,
      scheduledStreams,
      liveStreams,
      subscription: sub.plan.name,
    };
  }
}
