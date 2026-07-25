import { DataSource } from 'typeorm';
import { Role } from '../../users/entities/role.entity';

export async function seedRoles(dataSource: DataSource): Promise<Role[]> {
  const roleRepository = dataSource.getRepository(Role);
  const rolesToSeed = [
    { name: 'Owner', description: 'Workspace owner with full access' },
    { name: 'Manager', description: 'Workspace manager' },
    { name: 'Creator', description: 'Workspace content creator' },
    { name: 'Viewer', description: 'Workspace viewer' },
  ];

  const seededRoles: Role[] = [];
  for (const roleData of rolesToSeed) {
    let role = await roleRepository.findOneBy({ name: roleData.name });
    if (!role) {
      role = roleRepository.create(roleData);
      role = await roleRepository.save(role);
    }
    seededRoles.push(role);
  }
  return seededRoles;
}
