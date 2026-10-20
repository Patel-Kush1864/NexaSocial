import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { AuthService } from '../../src/auth/auth.service';
import { RoleEnum } from '../../src/auth/constants/roles.constants';

describe('Data Scope & Isolation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;

  // Test data
  let superAdminToken: string;
  let adminToken: string;
  let workspaceOwner1Token: string;
  let workspaceOwner2Token: string;

  let workspace1Id: string;
  let workspace2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    authService = app.get(AuthService);

    // Setup DB state
    const userRepository = dataSource.getRepository('User');
    const workspaceRepository = dataSource.getRepository('Workspace');
    const workspaceMemberRepository =
      dataSource.getRepository('WorkspaceMember');

    // Create Super Admin
    const superAdmin = await userRepository.save(
      userRepository.create({
        email: `sa_${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
      }),
    );
    superAdminToken = (await authService.login(superAdmin, '127.0.0.1'))
      .accessToken;

    // Create Admin
    const admin = await userRepository.save(
      userRepository.create({
        email: `admin_${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      }),
    );
    adminToken = (await authService.login(admin, '127.0.0.1')).accessToken;

    // Create Workspace Owner 1
    const owner1 = await userRepository.save(
      userRepository.create({
        email: `owner1_${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Owner',
        lastName: 'One',
        role: 'USER',
        isActive: true,
      }),
    );
    workspaceOwner1Token = (await authService.login(owner1, '127.0.0.1'))
      .accessToken;

    const ws1 = await workspaceRepository.save(
      workspaceRepository.create({
        name: 'Workspace 1',
        slug: `ws1-${Date.now()}`,
        ownerId: owner1.id,
      }),
    );
    workspace1Id = ws1.id;
    await workspaceMemberRepository.save(
      workspaceMemberRepository.create({
        userId: owner1.id,
        workspaceId: workspace1Id,
        role: RoleEnum.WORKSPACE_OWNER,
      }),
    );

    // Create Workspace Owner 2
    const owner2 = await userRepository.save(
      userRepository.create({
        email: `owner2_${Date.now()}@example.com`,
        password: 'Password123!',
        firstName: 'Owner',
        lastName: 'Two',
        role: 'USER',
        isActive: true,
      }),
    );
    workspaceOwner2Token = (await authService.login(owner2, '127.0.0.1'))
      .accessToken;

    const ws2 = await workspaceRepository.save(
      workspaceRepository.create({
        name: 'Workspace 2',
        slug: `ws2-${Date.now()}`,
        ownerId: owner2.id,
      }),
    );
    workspace2Id = ws2.id;
    await workspaceMemberRepository.save(
      workspaceMemberRepository.create({
        userId: owner2.id,
        workspaceId: workspace2Id,
        role: RoleEnum.WORKSPACE_OWNER,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /dashboard (Data Scope Tests)', () => {
    it('should allow SUPER_ADMIN to get platform dashboard without workspaceId', () => {
      return request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.workspace).toBeDefined();
          expect(res.body.workspace.id).toBe('platform');
        });
    });

    it('should allow ADMIN to get platform dashboard without workspaceId', () => {
      return request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.workspace).toBeDefined();
          expect(res.body.workspace.id).toBe('platform');
        });
    });

    it('should reject WORKSPACE_OWNER from accessing platform dashboard without workspaceId', () => {
      return request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${workspaceOwner1Token}`)
        .expect(400); // Because workspaceId is missing and they are not platform scope
    });

    it('should allow WORKSPACE_OWNER to get their own workspace dashboard', () => {
      return request(app.getHttpServer())
        .get(`/dashboard?workspaceId=${workspace1Id}`)
        .set('Authorization', `Bearer ${workspaceOwner1Token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.workspace.id).toBe(workspace1Id);
        });
    });

    it('should reject WORKSPACE_OWNER from accessing another workspace dashboard (IDOR)', () => {
      return request(app.getHttpServer())
        .get(`/dashboard?workspaceId=${workspace2Id}`)
        .set('Authorization', `Bearer ${workspaceOwner1Token}`)
        .expect(403); // Forbidden because they don't have access to ws2
    });
  });
});
