import { DataSource } from 'typeorm';
import { Platform } from '../entities/platform.entity';

export async function seedPlatforms(
  dataSource: DataSource,
): Promise<Platform[]> {
  const platformRepository = dataSource.getRepository(Platform);
  const platformsToSeed = [
    { name: 'YouTube', isActive: true },
    { name: 'Facebook', isActive: true },
    { name: 'Instagram', isActive: true },
    { name: 'LinkedIn', isActive: true },
    { name: 'X', isActive: true },
    { name: 'Twitch', isActive: true },
    { name: 'TikTok', isActive: true },
  ];

  const seededPlatforms: Platform[] = [];
  for (const platformData of platformsToSeed) {
    let platform = await platformRepository.findOneBy({
      name: platformData.name,
    });
    if (!platform) {
      platform = platformRepository.create(platformData);
      platform = await platformRepository.save(platform);
    }
    seededPlatforms.push(platform);
  }
  return seededPlatforms;
}
