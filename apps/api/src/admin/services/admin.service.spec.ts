import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdminService } from './admin.service';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';
import { LiveStream } from '../../livestreams/entities/livestream.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { AuditService } from '../../audit/services/audit.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockRepository = () => ({
    count: jest.fn().mockResolvedValue(10),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest
      .fn()
      .mockResolvedValue({ id: 'uuid-1', email: 'test@example.com' }),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    create: jest.fn().mockImplementation((dto) => dto),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '125000' }),
    }),
  });

  const mockAuditService = () => ({
    logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  });

  const mockEventEmitter = () => ({
    emit: jest.fn(),
  });

  const mockDataSource = () => ({
    isInitialized: true,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useFactory: mockRepository },
        { provide: getRepositoryToken(Workspace), useFactory: mockRepository },
        { provide: getRepositoryToken(Plan), useFactory: mockRepository },
        {
          provide: getRepositoryToken(UserSubscription),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(ConnectedAccount),
          useFactory: mockRepository,
        },
        { provide: getRepositoryToken(LiveStream), useFactory: mockRepository },
        { provide: getRepositoryToken(Payment), useFactory: mockRepository },
        { provide: AuditService, useFactory: mockAuditService },
        { provide: EventEmitter2, useFactory: mockEventEmitter },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return dashboard summary metrics', async () => {
    const summary = await service.getDashboardSummary();
    expect(summary).toBeDefined();
    expect(summary.totalUsers).toBe(10);
    expect(summary.monthlyRevenue).toBe(125000);
  });
});
