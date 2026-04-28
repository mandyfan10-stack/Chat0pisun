import type { Request } from 'express';
import { prisma } from '../config/db';
import { asyncHandler, HttpError } from './errorHandler';
import { verifyAccessToken } from '../utils/tokens';

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

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

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true },
  });

  if (!user) {
    throw new HttpError(401, 'Invalid access token', 'INVALID_TOKEN');
  }

  req.user = user;
  next();
});

export const getAuthUser = (req: AuthenticatedRequest): AuthUser => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  return req.user;
};
