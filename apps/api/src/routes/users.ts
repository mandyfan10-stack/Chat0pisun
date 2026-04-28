import { Router } from 'express';
import { prisma } from '../config/db';
import { getAuthUser, requireAuth } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { safeUserSelect, toSafeUserDto } from '../utils/dto';

export const usersRouter = Router();

usersRouter.get(
  '/search',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);
    const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    if (query.length < 2) {
      throw new HttpError(400, 'Search query must be at least 2 characters', 'INVALID_QUERY');
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: authUser.id },
        OR: [
          { username: { contains: query } },
          { email: { contains: query } },
          { displayName: { contains: query } },
        ],
      },
      select: safeUserSelect,
      orderBy: { username: 'asc' },
      take: 10,
    });

    res.json(users.map(toSafeUserDto));
  }),
);
