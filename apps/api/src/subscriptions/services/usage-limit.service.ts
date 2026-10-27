import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SubscriptionsService } from '../subscriptions.service';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Injectable()
export class UsageLimitService {
  private readonly logger = new Logger(UsageLimitService.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly dataSource: DataSource,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) { }

  private async getTableCount(
    tableName: string,
    userId: string,
    column = 'user_id',
  ): Promise<number> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      const tableExists = await queryRunner.hasTable(tableName);
      await queryRunner.release();

      if (!tableExists) {
        this.logger.debug(
          `Table "${tableName}" does not exist. Returning mock count.`,
        );
        return 0;
      }

      const result = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM \`${tableName}\` WHERE \`${column}\` = ? AND deleted_at IS NULL`,
        [userId],
      );
      return parseInt(result[0]?.count || '0', 10);
    } catch (e: any) {
      this.logger.warn(
        `Could not check counts in table "${tableName}": ${e.message}`,
      );
      return 0;
    }
  }

  async canCreateWorkspace(userId: string): Promise<boolean> {
    const sub = await this.subscriptionsService.findActiveSubscription(userId);
    if (!sub || !sub.plan?.features) return false;
    const limit = sub.plan.features.workspaces;

    if (limit === -1) return true; // Unlimited

    const currentCount = await this.getTableCount(
      'workspaces',
      userId,
      'owner_id',
    );
    return currentCount < limit;
  }

  async canAddMember(ownerId: string): Promise<boolean> {
    const sub = await this.subscriptionsService.findActiveSubscription(ownerId);
    if (!sub || !sub.plan?.features) return false;
    const limit = sub.plan.features.teamMembers;

    if (limit === -1) return true;

    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM \`workspace_members\` wm
         INNER JOIN \`workspaces\` w ON wm.workspace_id = w.id
         WHERE w.owner_id = ? AND wm.role != 'OWNER' AND wm.deleted_at IS NULL AND w.deleted_at IS NULL`,
        [ownerId],
      );
      const count = parseInt(result[0]?.count || '0', 10);
      return count < limit;
    } catch {
      return true;
    }
  }

  async canInviteMember(userId: string): Promise<boolean> {
    return this.canAddMember(userId);
  }

  async canConnectAccount(userId: string, workspaceId?: string): Promise<boolean> {
    let ownerId = userId;
    if (workspaceId) {
      const ws = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (ws) {
        ownerId = ws.ownerId;
      }
    }

    const sub = await this.subscriptionsService.findActiveSubscription(ownerId);
    if (!sub || !sub.plan?.features) return false;
    const limit = sub.plan.features.socialAccounts;

    if (limit === -1) return true;

    if (workspaceId) {
      try {
        const result = await this.dataSource.query(
          `SELECT COUNT(*) as count FROM \`connected_accounts\` WHERE \`workspace_id\` = ? AND deleted_at IS NULL`,
          [workspaceId],
        );
        const count = parseInt(result[0]?.count || '0', 10);
        return count < limit;
      } catch {
        return true;
      }
    }

    const currentCount = await this.getTableCount('social_accounts', userId);
    return currentCount < limit;
  }

  async canScheduleStream(userId: string, workspaceId?: string): Promise<boolean> {
    let ownerId = userId;
    if (workspaceId) {
      const ws = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (ws) {
        ownerId = ws.ownerId;
      }
    }
    const sub = await this.subscriptionsService.findActiveSubscription(ownerId);
    return !!sub?.plan?.features?.streamScheduling;
  }

  async canUseAnalytics(userId: string, workspaceId?: string): Promise<boolean> {
    let ownerId = userId;
    if (workspaceId) {
      const ws = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (ws) {
        ownerId = ws.ownerId;
      }
    }
    const sub = await this.subscriptionsService.findActiveSubscription(ownerId);
    return !!sub?.plan?.features?.analytics;
  }

  async canUseAI(userId: string, workspaceId?: string): Promise<boolean> {
    let ownerId = userId;
    if (workspaceId) {
      const ws = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (ws) {
        ownerId = ws.ownerId;
      }
    }
    const sub = await this.subscriptionsService.findActiveSubscription(ownerId);
    return !!sub?.plan?.features?.aiFeatures;
  }

  async canCreateStream(userId: string, workspaceId?: string): Promise<boolean> {
    let ownerId = userId;
    if (workspaceId) {
      const ws = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (ws) {
        ownerId = ws.ownerId;
      }
    }

    const sub = await this.subscriptionsService.findActiveSubscription(ownerId);
    if (!sub || !sub.plan?.features?.liveStreaming) {
      return false;
    }

    const limit =
      sub.plan.features.maxStreams ??
      (sub.plan.features.liveStreaming ? 100 : 0);
    if (limit === -1) return true;

    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM \`live_streams\` ls
         INNER JOIN \`workspaces\` w ON ls.workspace_id = w.id
         WHERE ${workspaceId ? 'ls.workspace_id = ?' : 'w.owner_id = ?'} AND ls.deleted_at IS NULL AND w.deleted_at IS NULL`,
        [workspaceId || ownerId],
      );
      const count = parseInt(result[0]?.count || '0', 10);
      return count < limit;
    } catch {
      return true;
    }
  }

  async canSchedulePost(userId: string, workspaceId?: string): Promise<boolean> {
    let ownerId = userId;
    if (workspaceId) {
      const ws = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (ws) {
        ownerId = ws.ownerId;
      }
    }
    const sub = await this.subscriptionsService.findActiveSubscription(ownerId);
    return !!sub?.plan?.features?.streamScheduling;
  }

  async canUseMediaLibrary(userId: string, workspaceId?: string): Promise<boolean> {
    let ownerId = userId;
    if (workspaceId) {
      const ws = await this.workspaceRepository.findOne({
        where: { id: workspaceId },
      });
      if (ws) {
        ownerId = ws.ownerId;
      }
    }
    const sub = await this.subscriptionsService.findActiveSubscription(ownerId);
    return sub?.plan?.features?.mediaLibrary ?? true;
  }
}
