import { createHash, randomBytes } from 'crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenUser {
  id: string;
  username: string;
}

export interface VerifiedAccessToken {
  userId: string;
  username: string;
}

export const signAccessToken = (user: AccessTokenUser): string => {
  const options: SignOptions = {
    subject: user.id,
    expiresIn: env.accessTokenExpiresIn,
  };

  return jwt.sign({ username: user.username }, env.jwtSecret, options);
};

export const verifyAccessToken = (token: string): VerifiedAccessToken => {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

  if (!decoded.sub || typeof decoded.username !== 'string') {
    throw new Error('Invalid access token payload');
  }

  return {
    userId: decoded.sub,
    username: decoded.username,
  };
};

export const createRefreshToken = (): string => {
  return randomBytes(48).toString('base64url');
};

export const hashRefreshToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

export const refreshTokenExpiresAt = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.refreshTokenExpiresDays);
  return expiresAt;
};
