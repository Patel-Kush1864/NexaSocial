/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class UsageLimitService {
  private readonly logger = new Logger(UsageLimitService.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly dataSource: DataSource,
  ) {}

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
        // Fallback mock counts if other modules are not yet migrated
        this.logger.debug(
          `Table "${tableName}" does not exist. Returning mock count.`,
        );
        return 0;
      }

      // Check count dynamically
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
    const sub = await this.subscriptionsService.getCurrentSubscription(userId);
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
    const sub = await this.subscriptionsService.getCurrentSubscription(ownerId);
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

  async canConnectAccount(userId: string): Promise<boolean> {
    const sub = await this.subscriptionsService.getCurrentSubscription(userId);
    const limit = sub.plan.features.socialAccounts;

    if (limit === -1) return true;

    const currentCount = await this.getTableCount('social_accounts', userId);
    return currentCount < limit;
  }

  async canScheduleStream(userId: string): Promise<boolean> {
    const sub = await this.subscriptionsService.getCurrentSubscription(userId);
    return sub.plan.features.streamScheduling;
  }

  async canUseAnalytics(userId: string): Promise<boolean> {
    const sub = await this.subscriptionsService.getCurrentSubscription(userId);
    return sub.plan.features.analytics;
  }

  async canUseAI(userId: string): Promise<boolean> {
    const sub = await this.subscriptionsService.getCurrentSubscription(userId);
    return sub.plan.features.aiFeatures;
  }

  async canCreateStream(ownerId: string): Promise<boolean> {
    const sub = await this.subscriptionsService.getCurrentSubscription(ownerId);
    let limit = 2; // Default limit
    if (sub.plan.name === 'Starter') limit = 10;
    if (sub.plan.name === 'Professional') limit = 100;
    if (sub.plan.name === 'Enterprise') limit = -1;

    if (limit === -1) return true;

    try {
      const result = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM \`live_streams\` ls
         INNER JOIN \`workspaces\` w ON ls.workspace_id = w.id
         WHERE w.owner_id = ? AND ls.deleted_at IS NULL AND w.deleted_at IS NULL`,
        [ownerId],
      );
      const count = parseInt(result[0]?.count || '0', 10);
      return count < limit;
    } catch {
      return true;
    }
  }
}
