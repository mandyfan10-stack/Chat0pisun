import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/tokens';
import { env } from '../config/env';

describe('Tokens Utility', () => {
  describe('verifyAccessToken', () => {
    it('should return decoded payload for a valid token', () => {
      const token = jwt.sign({ sub: 'user-123', username: 'testuser' }, env.jwtSecret);
      const result = verifyAccessToken(token);
      expect(result).toEqual({ userId: 'user-123', username: 'testuser' });
    });

    it('should throw an error if username is missing from payload', () => {
      const token = jwt.sign({ sub: 'user-123' }, env.jwtSecret);
      expect(() => verifyAccessToken(token)).toThrow('Invalid access token payload');
    });

    it('should throw an error if sub is missing from payload', () => {
      const token = jwt.sign({ username: 'testuser' }, env.jwtSecret);
      expect(() => verifyAccessToken(token)).toThrow('Invalid access token payload');
    });

    it('should throw an error if username is not a string', () => {
      const token = jwt.sign({ sub: 'user-123', username: 123 }, env.jwtSecret);
      expect(() => verifyAccessToken(token)).toThrow('Invalid access token payload');
    });

    it('should let jsonwebtoken throw on completely invalid token', () => {
      expect(() => verifyAccessToken('not-a-token')).toThrow();
    });
  });
});
