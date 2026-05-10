import type { Request } from 'express';
import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { asyncHandler, HttpError } from './errorHandler';
import { verifyAccessToken } from '../utils/tokens';

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const USER_CACHE_TTL = 300; // 5 minutes

export const requireAuth = asyncHandler(async (req: AuthenticatedRequest, _res, next) => {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  let payload: ReturnType<typeof verifyAccessToken>;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new HttpError(401, 'Invalid access token', 'INVALID_TOKEN');
  }

  const cacheKey = `user:${payload.userId}`;
  const cachedUser = await redis.get(cacheKey);

  if (cachedUser) {
    req.user = JSON.parse(cachedUser);
    return next();
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true },
  });

  if (!user) {
    throw new HttpError(401, 'Invalid access token', 'INVALID_TOKEN');
  }

  await redis.set(cacheKey, JSON.stringify(user), 'EX', USER_CACHE_TTL);

  req.user = user;
  next();
});

export const getAuthUser = (req: AuthenticatedRequest): AuthUser => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  return req.user;
};
