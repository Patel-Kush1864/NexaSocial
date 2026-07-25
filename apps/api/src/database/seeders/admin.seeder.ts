import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdminUser(
  dataSource: DataSource,
  roles: Role[],
): Promise<User | null> {
  const userRepository = dataSource.getRepository(User);
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nexasocial.com';

  let adminUser = await userRepository.findOneBy({ email: adminEmail });
  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const ownerRole = roles.find((r) => r.name === 'Owner');

    adminUser = userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'NexaSocial',
      isActive: true,
      roles: ownerRole ? [ownerRole] : [],
    });
    adminUser = await userRepository.save(adminUser);
  }
  return adminUser;
}
