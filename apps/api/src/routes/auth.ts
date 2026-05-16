import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { getAuthUser, requireAuth } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  createRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
  signAccessToken,
} from '../utils/tokens';
import { safeUserSelect, toSafeUserDto } from '../utils/dto';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/).toLowerCase(),
  displayName: z.string().min(1).max(80).optional(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string(),
});

const authRateLimit = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many auth requests. Try again later.' } },
  skip: () => env.isTest,
});

const SESSION_CACHE_TTL = 86400;

interface SessionCacheEntry {
  id: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
}

const cacheSession = (refreshTokenHash: string, entry: SessionCacheEntry) =>
  redis.set(`session:${refreshTokenHash}`, JSON.stringify(entry), 'EX', SESSION_CACHE_TTL);

const issueSession = async (user: { id: string; username: string }) => {
  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const expiresAt = refreshTokenExpiresAt();

  // Do NOT include user — avoid caching passwordHash in Redis
  const session = await prisma.session.create({
    data: { userId: user.id, refreshTokenHash, expiresAt },
  });

  await cacheSession(refreshTokenHash, {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt.toISOString(),
    revokedAt: null,
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
  };
};

authRouter.use(authRateLimit);

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const validated = registerSchema.safeParse(req.body);

    if (!validated.success) {
      throw new HttpError(400, 'Invalid input data', 'INVALID_INPUT', validated.error.flatten().fieldErrors);
    }

    const { email, username, displayName, password } = validated.data;
    const finalDisplayName = displayName || username;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: { email: true, username: true },
    });

    if (existingUser?.email === email) {
      throw new HttpError(409, 'Email is already registered', 'EMAIL_TAKEN');
    }

    if (existingUser?.username === username) {
      throw new HttpError(409, 'Username is already taken', 'USERNAME_TAKEN');
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: finalDisplayName,
        passwordHash: await hashPassword(password),
      },
      select: safeUserSelect,
    });
    const tokens = await issueSession(user);

    res.status(201).json({
      ...tokens,
      user: toSafeUserDto(user),
    });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const validated = loginSchema.safeParse(req.body);

    if (!validated.success) {
      throw new HttpError(400, 'Invalid input data', 'INVALID_INPUT', validated.error.flatten().fieldErrors);
    }

    const { email, password } = validated.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokens = await issueSession(user);

    res.json({
      ...tokens,
      user: toSafeUserDto(user),
    });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    if (typeof req.body.refreshToken !== 'string') {
      throw new HttpError(400, 'Refresh token is required', 'INVALID_INPUT');
    }

    const refreshTokenHash = hashRefreshToken(req.body.refreshToken);
    const cacheKey = `session:${refreshTokenHash}`;

    const sessionData = await redis.get(cacheKey);
    let session: SessionCacheEntry | null = null;

    if (sessionData) {
      session = JSON.parse(sessionData) as SessionCacheEntry;
    } else {
      const dbSession = await prisma.session.findUnique({
        where: { refreshTokenHash },
        select: { id: true, userId: true, expiresAt: true, revokedAt: true },
      });
      if (dbSession) {
        session = {
          id: dbSession.id,
          userId: dbSession.userId,
          expiresAt: dbSession.expiresAt.toISOString(),
          revokedAt: dbSession.revokedAt?.toISOString() ?? null,
        };
      }
    }

    if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) {
      throw new HttpError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const nextRefreshToken = createRefreshToken();
    const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);
    const nextExpiresAt = refreshTokenExpiresAt();

    // Fetch user separately — never store passwordHash in Redis
    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: nextRefreshTokenHash, expiresAt: nextExpiresAt },
      include: { user: true },
    });

    await redis.del(cacheKey);
    await cacheSession(nextRefreshTokenHash, {
      id: updatedSession.id,
      userId: updatedSession.userId,
      expiresAt: updatedSession.expiresAt.toISOString(),
      revokedAt: null,
    });

    res.json({
      accessToken: signAccessToken(updatedSession.user),
      refreshToken: nextRefreshToken,
      user: toSafeUserDto(updatedSession.user),
    });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    if (typeof req.body.refreshToken !== 'string') {
      throw new HttpError(400, 'Refresh token is required', 'INVALID_INPUT');
    }

    const refreshTokenHash = hashRefreshToken(req.body.refreshToken);

    await prisma.session.updateMany({
      where: {
        refreshTokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await redis.del(`session:${refreshTokenHash}`);

    res.status(204).send();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: safeUserSelect,
    });

    if (!user) {
      throw new HttpError(401, 'Invalid access token', 'INVALID_TOKEN');
    }

    res.json({ user: toSafeUserDto(user) });
  }),
);
