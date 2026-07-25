import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { UsersService } from '../../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSession } from '../../../src/users/entities/user-session.entity';
import { LoggerServiceWrapper } from '../../../src/logger/logger.service';
import { createMockUser, mockRegisterDto } from '../../fixtures/user.fixture';
import { createMockRepository } from '../../mocks/repository.mock';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService (Unit)', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let sessionRepo: any;
  let loggerService: jest.Mocked<Partial<LoggerServiceWrapper>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    loggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    sessionRepo = createMockRepository();
    sessionRepo.manager = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(UserSession), useValue: sessionRepo },
        { provide: LoggerServiceWrapper, useValue: loggerService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user when credentials match', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const user = createMockUser({ password: hashedPassword });

      usersService.findByEmail.mockResolvedValue(user as any);

      const result = await authService.validateUser(user.email, plainPassword);
      expect(result).toBeDefined();
      expect(result?.email).toBe(user.email);
    });

    it('should return null when password is invalid', async () => {
      const user = createMockUser({ password: 'hashedpassword' });
      usersService.findByEmail.mockResolvedValue(user as any);

      const result = await authService.validateUser(user.email, 'wrongpass');
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const result = await authService.validateUser(
        'unknown@example.com',
        'pass',
      );
      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should create user and assign verification token', async () => {
      const createdUser = createMockUser();
      usersService.create.mockResolvedValue(createdUser as any);
      usersService.save.mockResolvedValue(createdUser as any);

      const res = await authService.register(mockRegisterDto);

      expect(usersService.create).toHaveBeenCalledWith(
        {
          email: mockRegisterDto.email,
          password: mockRegisterDto.password,
          firstName: mockRegisterDto.firstName,
          lastName: mockRegisterDto.lastName,
        },
        'CREATOR',
      );
      expect(res.verificationToken).toBeDefined();
      expect(usersService.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if email is not verified', async () => {
      const unverifiedUser = createMockUser({ isEmailVerified: false });
      await expect(
        authService.login(unverifiedUser as any, { ipAddress: '127.0.0.1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return token response if verified', async () => {
      const verifiedUser = createMockUser({ isEmailVerified: true });
      sessionRepo.create.mockReturnValue({ id: 'session-123' });
      sessionRepo.save.mockResolvedValue({});

      const tokens = await authService.login(verifiedUser as any, {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Chrome/100',
      });

      expect(tokens.accessToken).toBe('mock-jwt-token');
      expect(tokens.refreshToken).toBe('mock-jwt-token');
      expect(tokens.expiresIn).toBe(900);
    });
  });

  describe('verifyEmail', () => {
    it('should mark email as verified for valid token', async () => {
      const token = 'valid-token-123';
      const user = createMockUser({
        isEmailVerified: false,
        verificationToken: token,
      });

      sessionRepo.manager.find.mockResolvedValue([user]);
      usersService.save.mockResolvedValue(user as any);

      await authService.verifyEmail(token);
      expect(user.isEmailVerified).toBe(true);
      expect(user.verificationToken).toBeUndefined();
    });

    it('should throw BadRequestException if token is invalid', async () => {
      sessionRepo.manager.find.mockResolvedValue([]);
      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
