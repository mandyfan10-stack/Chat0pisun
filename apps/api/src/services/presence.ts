import { redis } from '../config/redis';

const PRESENCE_KEY = 'presence:online_users';
const USER_HEARTBEAT_TTL = 60; // 60 seconds

export const markUserOnline = async (userId: string) => {
  // Use a hash or set to track online status. 
  // For scalability across instances, we use a key per user with TTL for heartbeats
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

/**
 * Returns a list of online users from the global set, 
 * cleaning up any that have expired heartbeats.
 */
export const getOnlineUserIds = async (): Promise<string[]> => {
  const allUserIds = await redis.smembers(PRESENCE_KEY);
  if (allUserIds.length === 0) return [];

  // Verify TTL for each user (optimizable with Lua if set is huge)
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

  // Cleanup expired IDs from the set in background
  if (expiredIds.length > 0) {
    redis.srem(PRESENCE_KEY, ...expiredIds);
  }

  return onlineIds;
};
