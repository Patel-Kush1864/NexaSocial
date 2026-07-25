import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from '../../../src/workspaces/services/workspaces.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Workspace } from '../../../src/workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../../../src/workspace-members/entities/workspace-member.entity';
import { ActivityLog } from '../../../src/users/entities/activity-log.entity';
import { UsersRepository } from '../../../src/users/repositories/users.repository';
import { UsageLimitService } from '../../../src/subscriptions/services/usage-limit.service';
import { SubscriptionsService } from '../../../src/subscriptions/subscriptions.service';
import { LoggerServiceWrapper } from '../../../src/logger/logger.service';
import { DataSource } from 'typeorm';
import { createMockRepository } from '../../mocks/repository.mock';
import { createMockWorkspace } from '../../fixtures/workspace.fixture';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WorkspacesService (Unit)', () => {
  let workspacesService: WorkspacesService;
  let workspaceRepo: any;
  let memberRepo: any;
  let activityRepo: any;
  let usageLimitService: jest.Mocked<Partial<UsageLimitService>>;
  let subscriptionsService: jest.Mocked<Partial<SubscriptionsService>>;

  beforeEach(async () => {
    workspaceRepo = createMockRepository();
    memberRepo = createMockRepository();
    activityRepo = createMockRepository();

    usageLimitService = {
      canCreateWorkspace: jest.fn().mockResolvedValue(true),
    };

    subscriptionsService = {
      assignFreePlan: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest
            .fn()
            .mockImplementation((e) => Promise.resolve({ id: 'w-123', ...e })),
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: getRepositoryToken(WorkspaceMember), useValue: memberRepo },
        { provide: getRepositoryToken(ActivityLog), useValue: activityRepo },
        { provide: UsersRepository, useValue: createMockRepository() },
        { provide: UsageLimitService, useValue: usageLimitService },
        { provide: SubscriptionsService, useValue: subscriptionsService },
        { provide: LoggerServiceWrapper, useValue: { log: jest.fn() } },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    workspacesService = module.get<WorkspacesService>(WorkspacesService);
  });

  describe('createWorkspace', () => {
    it('should throw BadRequestException if usage limit is reached', async () => {
      usageLimitService.canCreateWorkspace!.mockResolvedValue(false);

      await expect(
        workspacesService.createWorkspace('user-1', { name: 'My Workspace' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create workspace when within usage limits', async () => {
      usageLimitService.canCreateWorkspace!.mockResolvedValue(true);
      const res = await workspacesService.createWorkspace('user-1', {
        name: 'Alpha Tech',
      });
      expect(res).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if workspace does not exist', async () => {
      workspaceRepo.findOne.mockResolvedValue(null);
      await expect(workspacesService.findById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return workspace when found', async () => {
      const workspace = createMockWorkspace();
      workspaceRepo.findOne.mockResolvedValue(workspace);
      const res = await workspacesService.findById(workspace.id);
      expect(res.id).toBe(workspace.id);
    });
  });
});
