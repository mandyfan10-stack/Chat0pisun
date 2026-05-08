import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../config/db';
import { getAuthUser, requireAuth } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { toPublicUserDto, toSafeUserDto, safeUserSelect } from '../utils/dto';
import { normalizeDisplayName, normalizeBio } from '../utils/validation';

export const usersRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const authUser = getAuthUser(req);
    const ext = path.extname(file.originalname);
    cb(null, `${authUser.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(400, 'Only .jpg, .png and .webp formats allowed!', 'INVALID_FILE_TYPE'));
    }
  },
});

/** Select only public-safe fields (no email) for search results. */
const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  lastSeen: true,
  createdAt: true,
} as const;

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
          { displayName: { contains: query } },
        ],
      },
      select: publicUserSelect,
      orderBy: { username: 'asc' },
      take: 10,
    });

    res.json(users.map(toPublicUserDto));
  }),
);

usersRouter.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
    });

    if (!user) {
      throw new HttpError(401, 'User not found', 'USER_NOT_FOUND');
    }

    const displayName = normalizeDisplayName(req.body.displayName, user.displayName);
    const bio = normalizeBio(req.body.bio);

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        displayName,
        bio,
      },
      select: safeUserSelect,
    });

    res.json({ user: toSafeUserDto(updatedUser) });
  }),
);

usersRouter.post(
  '/me/avatar',
  requireAuth,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);

    if (!req.file) {
      throw new HttpError(400, 'No file uploaded', 'INVALID_INPUT');
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: { avatarUrl },
      select: safeUserSelect,
    });

    res.json({ user: toSafeUserDto(updatedUser) });
  }),
);
