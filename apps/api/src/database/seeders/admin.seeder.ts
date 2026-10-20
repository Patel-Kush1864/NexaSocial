import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdminUser(
  dataSource: DataSource,
  roles: Role[],
): Promise<User | null> {
  // 1. Production Safety Check
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development admin seed is disabled in production.');
  }

  // 2. Environment Validation
  const adminEmailRaw = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminEmailRaw) {
    throw new Error('ADMIN_SEED_EMAIL is not configured.');
  }

  if (!adminPassword) {
    throw new Error('ADMIN_SEED_PASSWORD is not configured.');
  }

  // 3. Email Normalization
  const adminEmail = adminEmailRaw.trim().toLowerCase();

  const userRepository = dataSource.getRepository(User);

  // 4. Role Verification
  const superAdminRole = roles.find((r) => r.name === 'SUPER_ADMIN');

  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found. Run role seed first.');
  }

  // 5. Find User by Email
  let adminUser = await userRepository.findOne({
    where: { email: adminEmail },
    relations: { role: true },
  });

  // 6. Idempotency & Role Assignment
  if (!adminUser) {
    console.log(`[AdminSeed] Admin user does not exist.`);
    console.log(`[AdminSeed] Creating development SUPER_ADMIN.`);

    // Hash password using bcrypt like the auth service
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    adminUser = userRepository.create({
      email: adminEmail,
      firstName: 'NexaSocial',
      lastName: 'Administrator',
      password: hashedPassword,
      isEmailVerified: true,
      status: 'ACTIVE',
      isActive: true,
      role: superAdminRole,
    });

    adminUser = await userRepository.save(adminUser);

    if (adminPassword === 'change-this-password') {
      console.warn(
        '[AdminSeed] WARNING: ADMIN_SEED_PASSWORD is using the default development password. Change it before using the account.',
      );
    }
    console.log(`[AdminSeed] Development SUPER_ADMIN created successfully.`);
  } else {
    console.log(`[AdminSeed] Admin user already exists.`);

    if (!adminUser.role || adminUser.role.name !== 'SUPER_ADMIN') {
      adminUser.role = superAdminRole;
      adminUser = await userRepository.save(adminUser);
      console.log(`[AdminSeed] Existing user promoted to SUPER_ADMIN role.`);
    } else {
      console.log(`[AdminSeed] Existing user already has SUPER_ADMIN role.`);
    }
  }

  return adminUser;
}
