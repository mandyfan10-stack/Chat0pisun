import { Router, type RequestHandler } from 'express';
import { env } from '../config/env';
import { prisma } from '../config/db';
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

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

const authRateLimit: RequestHandler = (req, _res, next) => {
  if (env.isTest) {
    return next();
  }

  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + env.authRateLimitWindowMs });
    return next();
  }

  if (bucket.count >= env.authRateLimitMax) {
    return next(new HttpError(429, 'Too many auth requests. Try again later.', 'RATE_LIMITED'));
  }

  bucket.count += 1;
  return next();
};

const normalizeEmail = (email: unknown): string => {
  if (typeof email !== 'string') {
    throw new HttpError(400, 'Email is required', 'INVALID_INPUT');
  }

  const normalized = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new HttpError(400, 'Email is invalid', 'INVALID_INPUT');
  }

  return normalized;
};

const normalizeUsername = (username: unknown): string => {
  if (typeof username !== 'string') {
    throw new HttpError(400, 'Username is required', 'INVALID_INPUT');
  }

  const normalized = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
    throw new HttpError(
      400,
      'Username must be 3-30 characters and use letters, numbers, or underscores',
      'INVALID_INPUT',
    );
  }

  return normalized;
};

const normalizeDisplayName = (displayName: unknown, fallback: string): string => {
  if (displayName === undefined || displayName === null || displayName === '') {
    return fallback;
  }

  if (typeof displayName !== 'string') {
    throw new HttpError(400, 'Display name is invalid', 'INVALID_INPUT');
  }

  const normalized = displayName.trim();

  if (!normalized || normalized.length > 80) {
    throw new HttpError(400, 'Display name must be 1-80 characters', 'INVALID_INPUT');
  }

  return normalized;
};

const validatePassword = (password: unknown): string => {
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters', 'INVALID_INPUT');
  }

  return password;
};

const issueSession = async (user: { id: string; username: string }) => {
  const refreshToken = createRefreshToken();

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiresAt(),
    },
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
    const email = normalizeEmail(req.body.email);
    const username = normalizeUsername(req.body.username);
    const displayName = normalizeDisplayName(req.body.displayName, username);
    const password = validatePassword(req.body.password);

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
        displayName,
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
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

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
    const session = await prisma.session.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new HttpError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const nextRefreshToken = createRefreshToken();
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashRefreshToken(nextRefreshToken),
        expiresAt: refreshTokenExpiresAt(),
      },
    });

    res.json({
      accessToken: signAccessToken(session.user),
      refreshToken: nextRefreshToken,
      user: toSafeUserDto(session.user),
    });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    if (typeof req.body.refreshToken !== 'string') {
      throw new HttpError(400, 'Refresh token is required', 'INVALID_INPUT');
    }

    await prisma.session.updateMany({
      where: {
        refreshTokenHash: hashRefreshToken(req.body.refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

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
