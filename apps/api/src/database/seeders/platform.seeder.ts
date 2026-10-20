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
    { name: 'X', isActive: true },
  ];

  // Ensure removed platforms are deactivated
  const removedPlatforms = ['LinkedIn', 'Twitch', 'TikTok'];
  for (const name of removedPlatforms) {
    const existing = await platformRepository.findOneBy({ name });
    if (existing && existing.isActive) {
      existing.isActive = false;
      await platformRepository.save(existing);
    }
  }

  const seededPlatforms: Platform[] = [];
  for (const platformData of platformsToSeed) {
    let platform = await platformRepository.findOneBy({
      name: platformData.name,
    });
    if (!platform) {
      platform = platformRepository.create(platformData);
      platform = await platformRepository.save(platform);
    } else if (!platform.isActive) {
      platform.isActive = true;
      platform = await platformRepository.save(platform);
    }
    seededPlatforms.push(platform);
  }
  return seededPlatforms;
}
