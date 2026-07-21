import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import {
  signAccessToken,
  verifyAccessToken,
  createRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
  AccessTokenUser
} from '../utils/tokens';

describe('tokens utils', () => {
  describe('signAccessToken', () => {
    it('should generate a valid JWT with correct payload', () => {
      const user: AccessTokenUser = {
        id: 'user-123',
        username: 'johndoe',
      };

      const token = signAccessToken(user);

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;

      expect(decoded.sub).toBe(user.id);
      expect(decoded.username).toBe(user.username);
      expect(decoded.exp).toBeDefined();
    });

    it('should call jwt.sign with correct parameters', () => {
      const user: AccessTokenUser = {
        id: 'user-456',
        username: 'janedoe',
      };

      const signSpy = jest.spyOn(jwt, 'sign');

      signAccessToken(user);

      expect(signSpy).toHaveBeenCalledWith(
        { username: user.username },
        env.jwtSecret,
        expect.objectContaining({
          subject: user.id,
          expiresIn: env.accessTokenExpiresIn,
        })
      );

      signSpy.mockRestore();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token and return correct payload', () => {
      const user: AccessTokenUser = {
        id: 'user-789',
        username: 'alice',
      };

      const token = signAccessToken(user);
      const verified = verifyAccessToken(token);

      expect(verified.userId).toBe(user.id);
      expect(verified.username).toBe(user.username);
    });

    it('should throw Error if payload sub is missing', () => {
      const token = jwt.sign({ username: 'bob' }, env.jwtSecret);
      expect(() => verifyAccessToken(token)).toThrow('Invalid access token payload');
    });

    it('should throw Error if username is missing', () => {
      const token = jwt.sign({ sub: 'user-bob' }, env.jwtSecret);
      expect(() => verifyAccessToken(token)).toThrow('Invalid access token payload');
    });

    it('should throw JsonWebTokenError on invalid token signature', () => {
       const user: AccessTokenUser = {
         id: 'user-789',
         username: 'alice',
       };
       const token = jwt.sign({ username: user.username }, 'wrong-secret', { subject: user.id });
       expect(() => verifyAccessToken(token)).toThrow();
    });
  });

  describe('createRefreshToken', () => {
    it('should generate a base64url encoded string', () => {
       const token = createRefreshToken();
       expect(typeof token).toBe('string');
       expect(token.length).toBeGreaterThan(0);
       // Check if it's base64url format
       expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
    });
  });

  describe('hashRefreshToken', () => {
    it('should return a hex hash', () => {
       const token = 'my-refresh-token';
       const hash = hashRefreshToken(token);
       expect(typeof hash).toBe('string');
       expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });
    it('should be deterministic', () => {
       const token = 'my-refresh-token';
       expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
    });
  });

  describe('refreshTokenExpiresAt', () => {
    it('should return a Date object set to env.refreshTokenExpiresDays in the future', () => {
       const now = new Date();
       const expiresAt = refreshTokenExpiresAt();

       const diffInDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
       expect(diffInDays).toBe(env.refreshTokenExpiresDays);
    });
  });
});
