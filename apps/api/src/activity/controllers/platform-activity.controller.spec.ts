/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PlatformActivityController } from './platform-activity.controller';
import { ActivityService } from '../services/activity.service';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';

describe('PlatformActivityController', () => {
  let controller: PlatformActivityController;
  let activityService: ActivityService;

  const mockActivityService = {
    getPlatformActivity: jest.fn(),
    getPlatformActivityById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformActivityController],
      providers: [
        {
          provide: ActivityService,
          useValue: mockActivityService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PlatformActivityController>(
      PlatformActivityController,
    );
    activityService = module.get<ActivityService>(ActivityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPlatformActivity', () => {
    it('should return paginated activity data', async () => {
      const mockResult = {
        data: [{ id: '1', action: 'TEST_EVENT' }],
        total: 1,
      };

      mockActivityService.getPlatformActivity.mockResolvedValue(mockResult);

      const query = { page: 2, limit: 10 };
      const expectedParams = { ...query, offset: 10, limit: 10 }; // limit is preserved as number

      const result = await controller.getPlatformActivity(query);

      expect(activityService.getPlatformActivity).toHaveBeenCalledWith(
        expectedParams,
      );
      expect(result).toEqual({
        data: mockResult.data,
        pagination: {
          page: 2,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should use default pagination values', async () => {
      const mockResult = {
        data: [{ id: '1', action: 'TEST_EVENT' }],
        total: 1,
      };

      mockActivityService.getPlatformActivity.mockResolvedValue(mockResult);

      const result = await controller.getPlatformActivity({});

      expect(activityService.getPlatformActivity).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('getActivityDetails', () => {
    it('should return activity details when found', async () => {
      const mockActivity = { id: '1', action: 'TEST_EVENT' };
      mockActivityService.getPlatformActivityById.mockResolvedValue(
        mockActivity,
      );

      const result = await controller.getActivityDetails('1');

      expect(activityService.getPlatformActivityById).toHaveBeenCalledWith('1');
      expect(result).toEqual({ data: mockActivity });
    });

    it('should throw NotFoundException when activity not found', async () => {
      mockActivityService.getPlatformActivityById.mockResolvedValue(null);

      await expect(controller.getActivityDetails('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
