import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { LoggerServiceWrapper } from '../../../src/logger/logger.service';
import { createMockUser, mockRegisterDto } from '../../fixtures/user.fixture';

describe('AuthController (Unit)', () => {
  let authController: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: LoggerServiceWrapper, useValue: { log: jest.fn() } },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should delegate register call to AuthService', async () => {
      const mockUser = createMockUser();
      authService.register!.mockResolvedValue(mockUser as any);

      const res = await authController.register(mockRegisterDto);
      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
      expect(res).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should extract client IP and user-agent and return tokens', async () => {
      const user = createMockUser();
      const mockTokenRes = {
        accessToken: 'a-1',
        refreshToken: 'r-1',
        expiresIn: 900,
      };
      authService.login!.mockResolvedValue(mockTokenRes);

      const req = {
        user,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'JestTestRunner' },
      } as any;

      const res = await authController.login(req, {
        email: user.email,
        password: 'Pass',
      });
      expect(authService.login).toHaveBeenCalledWith(user, {
        ipAddress: '127.0.0.1',
        userAgent: 'JestTestRunner',
      });
      expect(res).toEqual(mockTokenRes);
    });
  });
});
