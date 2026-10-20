import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityService } from './activity.service';
import { ActivityLog } from '../entities/activity-log.entity';

describe('ActivityService', () => {
  let service: ActivityService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: mockRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sanitizeMetadata', () => {
    it('should correctly sanitize sensitive fields in metadata', async () => {
      const sensitiveMetadata = {
        normal_field: 'safe_value',
        nested: {
          another_safe: '123',
          password: 'super_secret',
          tokenValue: 'token123',
          apiKey: 'key456',
        },
        card_number: '1234-5678-9012-3456',
        authorization: 'Bearer foo',
      };

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: '1',
              action: 'TEST',
              metadata: sensitiveMetadata,
              user: null,
              workspace: null,
            },
          ],
          1,
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.getPlatformActivity({});

      expect(result.data[0].metadata).toBeDefined();
      expect(result.data[0].metadata.normal_field).toEqual('safe_value');
      expect(result.data[0].metadata.nested.another_safe).toEqual('123');
      expect(result.data[0].metadata.nested.password).toEqual('[REDACTED]');
      expect(result.data[0].metadata.nested.tokenValue).toEqual('[REDACTED]');
      expect(result.data[0].metadata.nested.apiKey).toEqual('[REDACTED]');
      expect(result.data[0].metadata.card_number).toEqual('[REDACTED]');
      expect(result.data[0].metadata.authorization).toEqual('[REDACTED]');
    });
  });

  describe('handleAdminNotificationSent', () => {
    it('should log activity correctly for admin notifications', async () => {
      const payload = {
        adminId: 'admin123',
        action: 'NOTIFICATION_BROADCAST_SENT',
        metadata: { targetType: 'ALL_USERS' },
      };

      const expectedActivity = {
        userId: 'admin123',
        workspaceId: undefined,
        action: 'NOTIFICATION_BROADCAST_SENT',
        module: 'NOTIFICATIONS',
        description: 'Admin sent a notification broadcast to all users',
        metadata: payload.metadata,
        entityType: undefined,
        entityId: undefined,
      };

      mockRepository.create.mockReturnValue(expectedActivity);
      mockRepository.save.mockResolvedValue({ id: '1', ...expectedActivity });

      await service.handleAdminNotificationSent(payload);

      expect(mockRepository.create).toHaveBeenCalledWith(expectedActivity);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'activity.logged',
        expect.any(Object),
      );
    });
  });
});
