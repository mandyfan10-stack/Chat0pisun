import bcrypt from 'bcrypt';
import { env } from '../config/env';

const SALT_ROUNDS = env.isTest ? 4 : 12;

export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = (password: string, passwordHash: string): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};
