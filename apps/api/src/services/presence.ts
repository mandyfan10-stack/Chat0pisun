import { redis } from '../config/redis';
import { logger } from '../utils/logger';

const PRESENCE_KEY = 'presence:online_users';
const USER_HEARTBEAT_TTL = 60; // seconds

export const markUserOnline = async (userId: string) => {
  const userKey = `presence:user:${userId}`;
  await redis.set(userKey, 'online', 'EX', USER_HEARTBEAT_TTL);
  await redis.sadd(PRESENCE_KEY, userId);
};

export const markUserOffline = async (userId: string) => {
  const userKey = `presence:user:${userId}`;
  await redis.del(userKey);
  await redis.srem(PRESENCE_KEY, userId);
};

export const isUserOnline = async (userId: string): Promise<boolean> => {
  const userKey = `presence:user:${userId}`;
  const status = await redis.get(userKey);
  return status === 'online';
};

export const getOnlineUserIds = async (): Promise<string[]> => {
  const allUserIds = await redis.smembers(PRESENCE_KEY);
  if (allUserIds.length === 0) return [];

  const pipeline = redis.pipeline();
  allUserIds.forEach((id: string) => pipeline.exists(`presence:user:${id}`));
  const results = await pipeline.exec();

  const onlineIds: string[] = [];
  const expiredIds: string[] = [];

  results?.forEach(([err, exists]: [Error | null, unknown], index: number) => {
    if (!err && exists) {
      onlineIds.push(allUserIds[index]);
    } else {
      expiredIds.push(allUserIds[index]);
    }
  });

  if (expiredIds.length > 0) {
    // Await cleanup so the set stays bounded; errors are non-fatal
    await redis.srem(PRESENCE_KEY, ...expiredIds).catch((err: unknown) =>
      logger.error(err, 'Failed to clean up expired presence entries'),
    );
  }

  return onlineIds;
};
