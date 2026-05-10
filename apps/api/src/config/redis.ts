import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

const RedisConstructor = env.isTest ? require('ioredis-mock') : Redis;

export const redis = new RedisConstructor(env.redisUrl, {
  maxRetriesPerRequest: null,
  tls: env.redisUrl.startsWith('rediss://') || env.redisUrl.includes('upstash.io') ? {} : undefined,
});

redis.on('error', (err: Error) => {
  logger.error(err, 'Redis connection error');
});

redis.on('connect', () => {
  if (!env.isTest) {
    logger.info('Redis connected successfully');
  }
});
