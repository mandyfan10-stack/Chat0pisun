import { Router } from 'express';
import { prisma } from '../config/db';
import { getAuthUser, requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { safeUserSelect, toSafeUserDto } from '../utils/dto';

export const usersRouter = Router();

usersRouter.get(
  '/search',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);

    if (typeof req.query.q !== 'string') {
      return res.status(400).json({ error: 'Invalid search query' });
    }
    const query = req.query.q.trim().toLowerCase();

    // Security Fix: Prevent bulk user enumeration and performance degradation
    if (!query || query.length < 3) {
      return res.json([]);
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
