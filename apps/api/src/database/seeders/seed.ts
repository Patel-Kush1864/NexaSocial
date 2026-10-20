import { DataSource } from 'typeorm';
import { seedRolesAndPermissions } from './role.seeder';
import { seedPlans } from './plan.seeder';
import { seedPlatforms } from './platform.seeder';
import { seedAdminUser } from './admin.seeder';

export async function runSeed(dataSource: DataSource): Promise<void> {
  console.log('Seeding database...');

  const roles = await seedRolesAndPermissions(dataSource);
  console.log(`Seeded ${roles.length} roles and their permissions.`);

  const plans = await seedPlans(dataSource);
  console.log(`Seeded ${plans.length} subscription plans.`);

  const platforms = await seedPlatforms(dataSource);
  console.log(`Seeded ${platforms.length} social platforms.`);

  const admin = await seedAdminUser(dataSource, roles);
  if (admin) {
    console.log(`Seeded administrator: ${admin.email}`);
  }

  console.log('Database seeding complete!');
}
