import { DataSource, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { seedAdminUser } from './admin.seeder';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('Admin User Seeder', () => {
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let findOneMock: jest.Mock;
  let createMock: jest.Mock;
  let saveMock: jest.Mock;

  const superAdminRole = { id: 1, name: 'SUPER_ADMIN' } as unknown as Role;
  const adminRole = { id: 2, name: 'ADMIN' } as unknown as Role;
  const workspaceOwnerRole = {
    id: 3,
    name: 'WORKSPACE_OWNER',
  } as unknown as Role;
  const viewerRole = { id: 4, name: 'VIEWER' } as unknown as Role;
  const allRoles = [superAdminRole, adminRole, workspaceOwnerRole, viewerRole];

  beforeEach(() => {
    findOneMock = jest.fn();
    createMock = jest.fn();
    saveMock = jest.fn();

    userRepository = {
      findOne: findOneMock,
      create: createMock,
      save: saveMock,
    } as unknown as Repository<User>;

    dataSource = {
      getRepository: jest.fn().mockReturnValue(userRepository),
    } as unknown as DataSource;

    process.env.NODE_ENV = 'development';
    process.env.ADMIN_SEED_EMAIL = 'admin@nexasocial.local';
    process.env.ADMIN_SEED_PASSWORD = 'change-this-password';

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.ADMIN_SEED_EMAIL;
    delete process.env.ADMIN_SEED_PASSWORD;
  });

  it('TEST 1: user does not exist (created successfully)', async () => {
    findOneMock.mockResolvedValue(null);
    createMock.mockReturnValue({
      email: 'admin@nexasocial.local',
      role: superAdminRole,
    });
    saveMock.mockImplementation((user) => Promise.resolve({ id: 1, ...user }));

    const user = await seedAdminUser(dataSource, allRoles);

    expect(findOneMock).toHaveBeenCalledWith({
      where: { email: 'admin@nexasocial.local' },
      relations: { role: true },
    });
    expect(createMock).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('change-this-password', 10);
    expect(user?.role.name).toBe('SUPER_ADMIN');
  });

  it('TEST 2: user already exists with SUPER_ADMIN (no changes)', async () => {
    const existingUser = {
      id: 1,
      email: 'admin@nexasocial.local',
      role: superAdminRole,
    };
    findOneMock.mockResolvedValue(existingUser);

    const user = await seedAdminUser(dataSource, allRoles);

    expect(findOneMock).toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled(); // Role is already SUPER_ADMIN, no update needed
    expect(user?.role.name).toBe('SUPER_ADMIN');
  });

  it('TEST 3: user exists with ADMIN role (promoted to SUPER_ADMIN)', async () => {
    const existingUser = {
      id: 1,
      email: 'admin@nexasocial.local',
      role: adminRole,
    };
    findOneMock.mockResolvedValue(existingUser);
    saveMock.mockImplementation((user) => Promise.resolve(user));

    const user = await seedAdminUser(dataSource, allRoles);

    expect(findOneMock).toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled(); // Should save the updated role
    expect(user?.role.name).toBe('SUPER_ADMIN');
  });

  it('TEST 4: user exists with WORKSPACE_OWNER (promoted to SUPER_ADMIN)', async () => {
    const existingUser = {
      id: 1,
      email: 'admin@nexasocial.local',
      role: workspaceOwnerRole,
    };
    findOneMock.mockResolvedValue(existingUser);
    saveMock.mockImplementation((user) => Promise.resolve(user));

    const user = await seedAdminUser(dataSource, allRoles);

    expect(saveMock).toHaveBeenCalled();
    expect(user?.role.name).toBe('SUPER_ADMIN');
  });

  it('TEST 5: user exists with VIEWER (promoted to SUPER_ADMIN)', async () => {
    const existingUser = {
      id: 1,
      email: 'admin@nexasocial.local',
      role: viewerRole,
    };
    findOneMock.mockResolvedValue(existingUser);
    saveMock.mockImplementation((user) => Promise.resolve(user));

    const user = await seedAdminUser(dataSource, allRoles);

    expect(saveMock).toHaveBeenCalled();
    expect(user?.role.name).toBe('SUPER_ADMIN');
  });

  it('TEST 6: SUPER_ADMIN role does not exist (seed fails)', async () => {
    const rolesWithoutSuperAdmin = [adminRole, workspaceOwnerRole, viewerRole];

    await expect(
      seedAdminUser(dataSource, rolesWithoutSuperAdmin),
    ).rejects.toThrow('SUPER_ADMIN role not found');
  });

  it('TEST 7: email missing (seed fails)', async () => {
    delete process.env.ADMIN_SEED_EMAIL;

    await expect(seedAdminUser(dataSource, allRoles)).rejects.toThrow(
      'ADMIN_SEED_EMAIL is not configured',
    );
  });

  it('TEST 8: password missing (seed fails)', async () => {
    delete process.env.ADMIN_SEED_PASSWORD;

    await expect(seedAdminUser(dataSource, allRoles)).rejects.toThrow(
      'ADMIN_SEED_PASSWORD is not configured',
    );
  });

  it('TEST 9: production environment (seed is blocked)', async () => {
    process.env.NODE_ENV = 'production';

    await expect(seedAdminUser(dataSource, allRoles)).rejects.toThrow(
      'Development admin seed is disabled in production',
    );
  });

  it('TEST 10: idempotency execution (multiple runs only yield one admin user creation)', async () => {
    // First run (User does not exist)
    findOneMock.mockResolvedValueOnce(null);
    createMock.mockReturnValue({
      email: 'admin@nexasocial.local',
      role: superAdminRole,
    });
    saveMock.mockImplementationOnce((user) =>
      Promise.resolve({ id: 1, ...user }),
    );

    await seedAdminUser(dataSource, allRoles);

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledTimes(1);

    // Second run (User exists with SUPER_ADMIN)
    findOneMock.mockResolvedValueOnce({
      id: 1,
      email: 'admin@nexasocial.local',
      role: superAdminRole,
    });

    await seedAdminUser(dataSource, allRoles);

    // Create and save should NOT be called again
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });
});
