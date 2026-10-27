import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InvitationsService } from '../../../src/invitations/services/invitations.service';
import {
  Invitation,
  InvitationStatus,
} from '../../../src/invitations/entities/invitation.entity';
import { Workspace } from '../../../src/workspaces/entities/workspace.entity';
import {
  WorkspaceMember,
  WorkspaceRole,
} from '../../../src/workspace-members/entities/workspace-member.entity';
import { ActivityLog } from '../../../src/users/entities/activity-log.entity';
import { UsersRepository } from '../../../src/users/repositories/users.repository';
import { MailService } from '../../../src/mail/mail.service';
import { UsageLimitService } from '../../../src/subscriptions/services/usage-limit.service';
import { LoggerServiceWrapper } from '../../../src/logger/logger.service';

describe('InvitationsService (Unit & Security)', () => {
  let service: InvitationsService;

  const mockInvitationRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto) => ({ id: 'inv_123', ...dto })),
    save: jest.fn((inv) => Promise.resolve(inv)),
    remove: jest.fn().mockResolvedValue(true),
  };

  const mockWorkspaceRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockMemberRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn((dto) => ({ id: 'mem_123', ...dto })),
    save: jest.fn((mem) => Promise.resolve(mem)),
  };

  const mockActivityLogRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUsersRepo = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockMailService = {
    sendWorkspaceInvitation: jest.fn().mockResolvedValue(true),
    sendWorkspaceInvitationAccepted: jest.fn().mockResolvedValue(true),
    sendMail: jest.fn().mockResolvedValue(true),
  };

  const mockUsageLimitService = {
    canAddMember: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: getRepositoryToken(Invitation),
          useValue: mockInvitationRepo,
        },
        {
          provide: getRepositoryToken(Workspace),
          useValue: mockWorkspaceRepo,
        },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: mockMemberRepo,
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: mockActivityLogRepo,
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepo,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: UsageLimitService,
          useValue: mockUsageLimitService,
        },
        {
          provide: LoggerServiceWrapper,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  describe('validateToken', () => {
    it('returns invitation and workspace details for valid pending token', async () => {
      mockInvitationRepo.findOne.mockResolvedValue({
        id: 'inv_1',
        token: 'valid_tok_123',
        status: InvitationStatus.PENDING,
        email: 'member@example.com',
        role: WorkspaceRole.CREATOR,
        workspaceId: 'ws_alpha',
        expiresAt: new Date(Date.now() + 1000000),
        invitedById: 'owner_1',
      });
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws_alpha',
        name: 'Alpha Team',
      });
      mockUsersRepo.findById.mockResolvedValue({
        id: 'owner_1',
        firstName: 'Jane',
        lastName: 'Owner',
        email: 'owner@example.com',
      });

      const res = await service.validateToken('valid_tok_123');

      expect(res.valid).toBe(true);
      expect(res.workspaceName).toBe('Alpha Team');
      expect(res.role).toBe(WorkspaceRole.CREATOR);
      expect(res.email).toBe('member@example.com');
      expect(res.inviterName).toBe('Jane Owner');
    });

    it('rejects expired invitation token', async () => {
      mockInvitationRepo.findOne.mockResolvedValue({
        id: 'inv_old',
        token: 'expired_tok',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000000), // Expired
      });

      await expect(service.validateToken('expired_tok')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException for non-existent token', async () => {
      mockInvitationRepo.findOne.mockResolvedValue(null);

      await expect(service.validateToken('random_nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('accept', () => {
    it('Scenario C & D: New user accepts invitation and joins workspace with assigned role (CREATOR)', async () => {
      mockInvitationRepo.findOne.mockResolvedValue({
        id: 'inv_valid',
        token: 'accept_tok',
        status: InvitationStatus.PENDING,
        email: 'creator@example.com',
        role: WorkspaceRole.CREATOR,
        workspaceId: 'ws_alpha',
        expiresAt: new Date(Date.now() + 1000000),
        invitedById: 'owner_1',
      });
      mockUsersRepo.findById.mockResolvedValue({
        id: 'new_user_1',
        email: 'creator@example.com',
        firstName: 'Alex',
      });
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws_alpha',
        ownerId: 'owner_1',
        name: 'Alpha Studio',
      });
      mockMemberRepo.findOne.mockResolvedValue(null); // Not already a member
      mockUsageLimitService.canAddMember.mockResolvedValue(true); // Within limit

      const result = await service.accept(
        { token: 'accept_tok' },
        'new_user_1',
      );

      expect(result.success).toBe(true);
      expect(result.workspaceId).toBe('ws_alpha');
      expect(result.role).toBe(WorkspaceRole.CREATOR);
      expect(mockMemberRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws_alpha',
          userId: 'new_user_1',
          role: WorkspaceRole.CREATOR,
        }),
      );
      expect(mockInvitationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InvitationStatus.ACCEPTED,
        }),
      );
    });

    it('Scenario G: Rejects when signed-in user email does not match invitation email', async () => {
      mockInvitationRepo.findOne.mockResolvedValue({
        id: 'inv_valid',
        token: 'accept_tok',
        status: InvitationStatus.PENDING,
        email: 'correct@example.com',
        expiresAt: new Date(Date.now() + 1000000),
      });
      mockUsersRepo.findById.mockResolvedValue({
        id: 'wrong_user',
        email: 'wrong@example.com', // Mismatch!
      });

      await expect(
        service.accept({ token: 'accept_tok' }, 'wrong_user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Scenario G: Case-insensitive email matching allows acceptance', async () => {
      mockInvitationRepo.findOne.mockResolvedValue({
        id: 'inv_case',
        token: 'accept_tok_case',
        status: InvitationStatus.PENDING,
        email: 'Member@Example.COM',
        role: WorkspaceRole.VIEWER,
        workspaceId: 'ws_beta',
        expiresAt: new Date(Date.now() + 1000000),
        invitedById: 'owner_1',
      });
      mockUsersRepo.findById.mockResolvedValue({
        id: 'user_case',
        email: 'member@example.com', // Lowercase match
      });
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws_beta',
        ownerId: 'owner_1',
        name: 'Beta WS',
      });
      mockMemberRepo.findOne.mockResolvedValue(null);
      mockUsageLimitService.canAddMember.mockResolvedValue(true);

      const result = await service.accept(
        { token: 'accept_tok_case' },
        'user_case',
      );

      expect(result.success).toBe(true);
      expect(result.role).toBe(WorkspaceRole.VIEWER);
    });

    it('Scenario B & G: Idempotency - already accepted member returns success without duplicating', async () => {
      mockInvitationRepo.findOne.mockResolvedValue({
        id: 'inv_accepted',
        token: 'already_accepted_tok',
        status: InvitationStatus.ACCEPTED,
        email: 'member@example.com',
        workspaceId: 'ws_gamma',
        role: WorkspaceRole.MANAGER,
      });
      mockUsersRepo.findById.mockResolvedValue({
        id: 'user_123',
        email: 'member@example.com',
      });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'existing_mem',
        workspaceId: 'ws_gamma',
        userId: 'user_123',
        role: WorkspaceRole.MANAGER,
      });

      const result = await service.accept(
        { token: 'already_accepted_tok' },
        'user_123',
      );

      expect(result.success).toBe(true);
      expect(result.workspaceId).toBe('ws_gamma');
      expect(result.role).toBe(WorkspaceRole.MANAGER);
      expect(mockMemberRepo.create).not.toHaveBeenCalled();
    });

    it('Scenario H: Rejects invitation acceptance when workspace owner member limit is reached', async () => {
      mockInvitationRepo.findOne.mockResolvedValue({
        id: 'inv_limit',
        token: 'tok_limit',
        status: InvitationStatus.PENDING,
        email: 'new_member@example.com',
        workspaceId: 'ws_limit',
        expiresAt: new Date(Date.now() + 1000000),
      });
      mockUsersRepo.findById.mockResolvedValue({
        id: 'new_user_limit',
        email: 'new_member@example.com',
      });
      mockWorkspaceRepo.findOne.mockResolvedValue({
        id: 'ws_limit',
        ownerId: 'owner_limit_reached',
      });
      mockMemberRepo.findOne.mockResolvedValue(null);
      // Member limit exceeded
      mockUsageLimitService.canAddMember.mockResolvedValue(false);

      await expect(
        service.accept({ token: 'tok_limit' }, 'new_user_limit'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
