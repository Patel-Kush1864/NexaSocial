/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConnectedAccount } from '../../social/entities/connected-account.entity';

/**
 * Extracts follower/subscriber count from account metadata across all supported platforms.
 * Returns null if the platform does not provide followers or has not been synchronized yet.
 */
export function extractAccountFollowers(
  accountOrPlatform: ConnectedAccount | string,
  metadata?: Record<string, any>,
): number | null {
  let meta: any = null;
  let platform = '';

  if (typeof accountOrPlatform === 'string') {
    platform = accountOrPlatform.toUpperCase();
    meta = metadata;
  } else if (accountOrPlatform && typeof accountOrPlatform === 'object') {
    platform = (accountOrPlatform.platformName || '').toUpperCase();
    meta = metadata ?? accountOrPlatform.metadata;
  }

  if (!meta || typeof meta !== 'object') {
    return null;
  }

  if (platform === 'YOUTUBE') {
    const val = meta.subscribers ?? meta.subscriberCount;
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Math.max(0, parseInt(String(val), 10));
    }
  } else if (platform === 'INSTAGRAM') {
    const val = meta.followers ?? meta.followersCount ?? meta.followers_count;
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Math.max(0, parseInt(String(val), 10));
    }
  } else if (platform === 'FACEBOOK') {
    const val =
      meta.followers ?? meta.followers_count ?? meta.fan_count ?? meta.likes;
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Math.max(0, parseInt(String(val), 10));
    }
  } else if (platform === 'TWITTER' || platform === 'X') {
    const val = meta.followersCount ?? meta.followers_count ?? meta.followers;
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Math.max(0, parseInt(String(val), 10));
    }
  } else if (platform === 'TIKTOK') {
    const val = meta.followerCount ?? meta.followers ?? meta.follower_count;
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Math.max(0, parseInt(String(val), 10));
    }
  } else if (platform === 'TWITCH') {
    const val = meta.followers ?? meta.followerCount;
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Math.max(0, parseInt(String(val), 10));
    }
  } else if (platform === 'LINKEDIN') {
    const val = meta.followers ?? meta.followerCount;
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      return Math.max(0, parseInt(String(val), 10));
    }
  }

  // Generic fallback for any metadata key
  for (const key of [
    'followers',
    'followersCount',
    'followers_count',
    'subscribers',
    'subscriberCount',
    'fan_count',
  ]) {
    if (
      meta[key] !== undefined &&
      meta[key] !== null &&
      !isNaN(Number(meta[key]))
    ) {
      return Math.max(0, parseInt(String(meta[key]), 10));
    }
  }

  return null;
}

/**
 * Extracts engagement / interaction metrics (likes, views, reactions) from metadata.
 * Returns null if no engagement metrics are provided.
 */
export function extractAccountInteractions(
  accountOrPlatform: ConnectedAccount | string,
  metadata?: Record<string, any>,
): number | null {
  let meta: any = null;

  if (typeof accountOrPlatform === 'string') {
    meta = metadata;
  } else if (accountOrPlatform && typeof accountOrPlatform === 'object') {
    meta = metadata ?? accountOrPlatform.metadata;
  }

  if (!meta || typeof meta !== 'object') {
    return null;
  }

  let total = 0;
  let hasData = false;

  const interactionKeys = [
    'likes',
    'likesCount',
    'views',
    'viewCount',
    'comments',
    'shares',
    'reactions',
  ];
  for (const k of interactionKeys) {
    if (meta[k] !== undefined && meta[k] !== null && !isNaN(Number(meta[k]))) {
      total += parseInt(String(meta[k]), 10);
      hasData = true;
    }
  }

  return hasData ? total : null;
}

/**
 * Normalizes platform name for presentation (e.g. 'TWITTER' -> 'X')
 */
export function normalizePlatformName(platform: string): string {
  if (!platform) return 'OTHER';
  const upper = platform.toUpperCase().trim();
  if (upper === 'TWITTER') return 'X';
  return upper;
}
