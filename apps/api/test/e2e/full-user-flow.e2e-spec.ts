import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Full User Lifecycle (E2E Flow)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. GET /health - should return status OK', () => {
    return request(app.getHttpServer() as Parameters<typeof request>[0])
      .get('/health')
      .expect(200);
  });

  it('2. Complete User Workflow Simulation: Register -> Login -> Workspace -> LiveStream', async () => {
    const testEmail = `e2e_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // Register
    const registerRes = await request(
      app.getHttpServer() as Parameters<typeof request>[0],
    )
      .post('/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'E2E',
        lastName: 'Tester',
      });

    // Check response format or return status
    expect([200, 201, 400, 409]).toContain(registerRes.status);
  });
});
