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
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token-xyz') },
        },
        {
          provide: LoggerServiceWrapper,
          useValue: { log: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should integrate register flow between AuthService and UsersService', async () => {
    const mockUser = createMockUser({ email: 'integration@test.com' });
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
