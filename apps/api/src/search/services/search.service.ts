import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { LiveStream } from '../../livestreams/entities/livestream.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { SystemSetting } from '../../system-settings/entities/system-setting.entity';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';
import { CurrentUser as CurrentUserType } from '../../auth/interfaces/current-user.interface';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(LiveStream)
    private readonly streamRepository: Repository<LiveStream>,
    @InjectRepository(ConnectedAccount)
    private readonly accountRepository: Repository<ConnectedAccount>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(SystemSetting)
    private readonly settingsRepository: Repository<SystemSetting>,
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
  ) {}

  async globalSearch(query: string, user: CurrentUserType) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const hasPerm = (p: string) =>
      isSuperAdmin || user.permissions?.includes(p);

    const term = `%${query}%`;
    const results: Record<string, any[]> = {
      users: [],
      workspaces: [],
      subscriptions: [],
      liveStreams: [],
      socialAccounts: [],
      payments: [],
      settings: [],
    };

    const searchPromises: Promise<void>[] = [];

    // 1. Users
    if (hasPerm('platform.users.view')) {
      searchPromises.push(
        this.userRepository
          .find({
            where: [
              { firstName: ILike(term) },
              { lastName: ILike(term) },
              { email: ILike(term) },
            ],
            take: 5,
            select: ['id', 'firstName', 'lastName', 'email', 'status'],
          })
          .then((data) => {
            results.users = data.map((u) => ({
              id: u.id,
              name:
                `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
              email: u.email,
              status: u.status,
            }));
          }),
      );
    }

    // 2. Workspaces
    if (hasPerm('platform.workspaces.view')) {
      searchPromises.push(
        this.workspaceRepository
          .find({
            where: { name: ILike(term) },
            take: 5,
            select: ['id', 'name', 'status'],
          })
          .then((data) => {
            results.workspaces = data;
          }),
      );
    }

    // 2.5 Subscriptions
    if (hasPerm('platform.subscriptions.view')) {
      searchPromises.push(
        this.subscriptionRepository
          .find({
            relations: ['user', 'plan'],
            where: [
              { user: { firstName: ILike(term) } },
              { user: { lastName: ILike(term) } },
              { user: { email: ILike(term) } },
              { plan: { name: ILike(term) } },
            ],
            take: 5,
          })
          .then((data) => {
            results.subscriptions = data.map((s) => ({
              id: s.id,
              planName: s.plan?.name || 'Unknown Plan',
              userName: s.user
                ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() ||
                  s.user.email
                : 'Unknown User',
              status: s.status,
            }));
          }),
      );
    }

    // 3. Live Streams
    if (hasPerm('platform.livestreams.view')) {
      searchPromises.push(
        this.streamRepository
          .find({
            where: { title: ILike(term) },
            take: 5,
            select: ['id', 'title', 'status'],
          })
          .then((data) => {
            results.liveStreams = data.map((s) => ({
              id: s.id,
              title: s.title,
              platform: 'Multi-platform',
              status: s.status,
            }));
          }),
      );
    }

    // 4. Social Accounts
    if (hasPerm('platform.connected_accounts.view')) {
      searchPromises.push(
        this.accountRepository
          .find({
            where: [{ name: ILike(term) }, { platformName: ILike(term) }],
            take: 5,
            select: ['id', 'platformName', 'name', 'status'],
          })
          .then((data) => {
            results.socialAccounts = data.map((a) => ({
              id: a.id,
              platform: a.platformName,
              accountName: a.name,
              status: a.status,
            }));
          }),
      );
    }

    // 5. Payments
    if (hasPerm('platform.payments.view')) {
      searchPromises.push(
        this.paymentRepository
          .find({
            where: { gatewayPaymentId: ILike(term) },
            take: 5,
            select: [
              'id',
              'gatewayPaymentId',
              'amount',
              'status',
              'created_at',
            ],
          })
          .then((data) => {
            results.payments = data.map((p) => ({
              id: p.id,
              transactionId: p.gatewayPaymentId || p.id,
              amount: p.amount.toString(),
              status: p.status,
              createdAt: p.created_at,
            }));
          }),
      );
    }

    // 6. Settings
    if (hasPerm('platform.settings.view')) {
      searchPromises.push(
        this.settingsRepository
          .find({
            where: [{ key: ILike(term) }, { description: ILike(term) }],
            take: 5,
            select: ['id', 'key', 'description'],
          })
          .then((data) => {
            results.settings = data.map((s) => ({
              id: s.id,
              name: s.key,
              description: s.description || s.key,
            }));
          }),
      );
    }

    await Promise.allSettled(searchPromises);

    return {
      query,
      results,
    };
  }
}
