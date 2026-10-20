import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { LiveStream } from '../../livestreams/entities/livestream.entity';
import { ConnectedAccount } from '../../social/entities/connected-account.entity';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';
import { Payment } from '../../payments/entities/payment.entity';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(10),
    getRawMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    clone: function () {
      return this;
    },
  };

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
        { provide: getRepositoryToken(Workspace), useValue: mockRepository },
        { provide: getRepositoryToken(LiveStream), useValue: mockRepository },
        {
          provide: getRepositoryToken(ConnectedAccount),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(UserSubscription),
          useValue: mockRepository,
        },
        { provide: getRepositoryToken(Payment), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReport', () => {
    it('should generate users report successfully', async () => {
      const result = await service.generateReport({ reportType: 'USERS' });
      expect(result).toBeDefined();
      expect(result.reportType).toBe('USERS');
      expect(result.summary.total).toBe(10);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should generate revenue report successfully', async () => {
      const result = await service.generateReport({ reportType: 'REVENUE' });
      expect(result).toBeDefined();
      expect(result.reportType).toBe('REVENUE');
    });

    it('should export to CSV safely', async () => {
      // Mock some data specifically for CSV output testing
      mockQueryBuilder.getManyAndCount = jest.fn().mockResolvedValueOnce([
        [
          {
            id: '1',
            email: '=cmd|/c calc!A0',
            firstName: 'John',
            status: 'ACTIVE',
            createdAt: new Date(),
          },
        ],
        1,
      ]);
      const result = await service.generateReport({
        reportType: 'USERS',
        format: 'CSV' as any,
      });

      expect(result).toContain('ID,Email,First Name');
      // Should escape the dangerous email starting with =
      expect(result).toContain("'=cmd|/c calc!A0");
    });
  });
});
