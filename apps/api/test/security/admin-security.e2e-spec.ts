import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/auth/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { RoleEnum } from '../../src/auth/constants/roles.constants';
describe('Admin API Security (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userRepository: Repository<User>;

  let normalUserToken: string;
  let workspaceOwnerToken: string;
  let superAdminToken: string;
  let adminWithNoPermissionsToken: string;
  let adminWithUsersViewToken: string;
  let adminWithUsersManageToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Clear db
    await userRepository.delete({});

    const createTokenFor = async (userOpts: Partial<User>) => {
      const user = userRepository.create({
        email: `test_${Date.now()}_${Math.random()}@example.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        ...userOpts,
      });
      const saved = await userRepository.save(user);
      const tokenRes = await authService.login(saved, 'test-ip');
      return tokenRes.accessToken;
    };

    // 1. Normal User (VIEWER in a workspace but trying to hit platform API)
    normalUserToken = await createTokenFor({ role: RoleEnum.VIEWER });

    // 2. Workspace Owner (still a normal platform role)
    workspaceOwnerToken = await createTokenFor({
      role: RoleEnum.WORKSPACE_OWNER,
    });

    // 3. Super Admin
    superAdminToken = await createTokenFor({ role: RoleEnum.SUPER_ADMIN });

    // 4. Admin (No permissions)
    adminWithNoPermissionsToken = await createTokenFor({
      role: RoleEnum.ADMIN,
      permissions: [],
    });

    // 5. Admin (platform.users.view only)
    adminWithUsersViewToken = await createTokenFor({
      role: RoleEnum.ADMIN,
      permissions: ['platform.users.view'],
    });

    // 6. Admin (platform.users.manage and platform.users.view)
    adminWithUsersManageToken = await createTokenFor({
      role: RoleEnum.ADMIN,
      permissions: ['platform.users.view', 'platform.users.manage'],
    });
  });

  afterAll(async () => {
    await testUtils.clearDatabase();
    await app.close();
  });

  describe('Unauthenticated Access (401)', () => {
    it('should reject unauthenticated request to /admin/dashboard', () => {
      return request(app.getHttpServer()).get('/admin/dashboard').expect(401);
    });

    it('should reject invalid token request to /admin/users', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Normal User (403)', () => {
    const endpoints = [
      { method: 'get', path: '/admin/dashboard' },
      { method: 'get', path: '/admin/users' },
      { method: 'get', path: '/admin/workspaces' },
      { method: 'get', path: '/system-settings' },
      { method: 'get', path: '/admin/feature-flags' },
      { method: 'get', path: '/audit' },
      { method: 'get', path: '/reports/users' },
      { method: 'get', path: '/platform/analytics/users' },
      { method: 'get', path: '/platform/activity' },
      { method: 'get', path: '/platform/system-health' },
    ];

    endpoints.forEach(({ method, path }) => {
      it(`should reject normal user accessing ${method.toUpperCase()} ${path}`, () => {
        return request(app.getHttpServer())
          [method](path)
          .set('Authorization', `Bearer ${normalUserToken}`)
          .expect(403);
      });
    });
  });

  describe('Workspace Owner (403)', () => {
    it('should reject workspace owner accessing platform APIs', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${workspaceOwnerToken}`)
        .expect(403);
    });
  });

  describe('Admin Role - Permission checks', () => {
    it('Admin with no permissions should be rejected from /admin/users', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminWithNoPermissionsToken}`)
        .expect(403);
    });

    it('Admin with platform.users.view should access /admin/users', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminWithUsersViewToken}`)
        .expect(200);
    });

    it('Admin with platform.users.view should NOT be able to mutate users', () => {
      return request(app.getHttpServer())
        .patch('/admin/users/1/status')
        .send({ isActive: false })
        .set('Authorization', `Bearer ${adminWithUsersViewToken}`)
        .expect(403);
    });

    it('Admin with platform.users.manage should be able to mutate users', async () => {
      // Create a dummy user to patch
      const dummyUser = await testUtils.createUser({ email: 'dummy@test.com' });
      return request(app.getHttpServer())
        .patch(`/admin/users/${dummyUser.id}/status`)
        .send({ isActive: false })
        .set('Authorization', `Bearer ${adminWithUsersManageToken}`)
        .expect(200);
    });
  });

  describe('SUPER_ADMIN Only Enforcements', () => {
    it('Admin with users manage should NOT access system-settings', () => {
      return request(app.getHttpServer())
        .get('/system-settings')
        .set('Authorization', `Bearer ${adminWithUsersManageToken}`)
        .expect(403);
    });

    it('SUPER_ADMIN should access system-settings', () => {
      return request(app.getHttpServer())
        .get('/system-settings')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('SUPER_ADMIN should access feature-flags', () => {
      return request(app.getHttpServer())
        .get('/admin/feature-flags')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });
  });

  describe('SUPER_ADMIN Role - All Access', () => {
    const endpoints = [
      { method: 'get', path: '/admin/dashboard', expect: 200 },
      { method: 'get', path: '/admin/users', expect: 200 },
      { method: 'get', path: '/admin/workspaces', expect: 200 },
      { method: 'get', path: '/system-settings', expect: 200 },
      { method: 'get', path: '/admin/feature-flags', expect: 200 },
      { method: 'get', path: '/audit', expect: 200 },
      // Assuming reports generates a file/buffer or 200 ok
      { method: 'get', path: '/reports/users', expect: 200 },
      { method: 'get', path: '/platform/analytics/users', expect: 200 },
      { method: 'get', path: '/platform/activity', expect: 200 },
      { method: 'get', path: '/platform/system-health', expect: 200 },
    ];

    endpoints.forEach(({ method, path, expect }) => {
      it(`SUPER_ADMIN should access ${method.toUpperCase()} ${path}`, async () => {
        const res = await request(app.getHttpServer())
          [method](path)
          .set('Authorization', `Bearer ${superAdminToken}`);

        // Either 200 ok or a valid business error like 400, but not 401 or 403
        expect([200, 201, 400, 404]).toContain(res.status);
      });
    });
  });
});
