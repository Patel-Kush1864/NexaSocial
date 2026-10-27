import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSession } from '../../src/users/entities/user-session.entity';
import { User } from '../../src/users/entities/user.entity';
import { Role } from '../../src/users/entities/role.entity';
import { UsersRepository } from '../../src/users/repositories/users.repository';
import { LoggerServiceWrapper } from '../../src/logger/logger.service';
import { createMockRepository } from '../mocks/repository.mock';
import { createMockUser } from '../fixtures/user.fixture';

import { ActivityLog } from '../../src/users/entities/activity-log.entity';
import { DataSource } from 'typeorm';
import { AuditService } from '../../src/audit/services/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailService } from '../../src/mail/mail.service';
import { WorkspacesService } from '../../src/workspaces/services/workspaces.service';
import { InvitationsService } from '../../src/invitations/services/invitations.service';

describe('Auth -> Users Module Integration', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const userRepo = createMockRepository();
    const roleRepo = createMockRepository();
    const sessionRepo = createMockRepository();

    const mockUsersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      rawRepository: userRepo,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: getRepositoryToken(UserSession), useValue: sessionRepo },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: createMockRepository(),
        },
        {
          provide: DataSource,
          useValue: { query: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: AuditService,
          useValue: { logSecurityEvent: jest.fn(), logAction: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token-xyz') },
        },
        {
          provide: LoggerServiceWrapper,
          useValue: { log: jest.fn(), error: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: MailService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue(true),
            sendWelcomeEmail: jest.fn().mockResolvedValue(true),
            sendEmailVerification: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: WorkspacesService,
          useValue: {
            createDefaultWorkspace: jest.fn().mockResolvedValue({ id: 'ws_default_1', name: "Default's Workspace" }),
          },
        },
        {
          provide: InvitationsService,
          useValue: {
            getInvitationByToken: jest.fn(),
            accept: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should integrate register flow between AuthService and UsersService', async () => {
    const mockUser = createMockUser({
      email: 'integration@test.com',
      verificationToken: 'token-xyz',
    });
    jest.spyOn(usersService, 'create').mockResolvedValue(mockUser as any);
    jest.spyOn(usersService, 'save').mockResolvedValue(mockUser as any);

    const result = await authService.register({
      email: 'integration@test.com',
      password: 'Password123!',
      firstName: 'Integration',
      lastName: 'User',
    });

    expect(result.email).toBe('integration@test.com');
    expect(result.verificationToken).toBeDefined();
  });
});
