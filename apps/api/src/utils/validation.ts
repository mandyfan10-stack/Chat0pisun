import { HttpError } from '../middleware/errorHandler';

export const normalizeEmail = (email: unknown): string => {
  if (typeof email !== 'string') {
    throw new HttpError(400, 'Email is required', 'INVALID_INPUT');
  }

  const normalized = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new HttpError(400, 'Email is invalid', 'INVALID_INPUT');
  }

  return normalized;
};

export const normalizeUsername = (username: unknown): string => {
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

export const normalizeDisplayName = (displayName: unknown, fallback: string): string => {
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

export const validatePassword = (password: unknown): string => {
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters', 'INVALID_INPUT');
  }

  if (password.length > 128) {
    throw new HttpError(400, 'Password must be at most 128 characters', 'INVALID_INPUT');
  }

  return password;
};

export const normalizeBio = (bio: unknown): string | null => {
  if (bio === undefined || bio === null || bio === '') {
    return null;
  }

  if (typeof bio !== 'string') {
    throw new HttpError(400, 'Bio is invalid', 'INVALID_INPUT');
  }

  const normalized = bio.trim();

  if (normalized.length > 500) {
    throw new HttpError(400, 'Bio must be at most 500 characters', 'INVALID_INPUT');
  }

  return normalized || null;
};
