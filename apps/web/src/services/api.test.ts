import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from './api';

describe('API Service - Token Storage', () => {
  const ACCESS_TOKEN_KEY = 'chat0pisun.accessToken';
  const REFRESH_TOKEN_KEY = 'chat0pisun.refreshToken';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any mocks
    vi.clearAllMocks();
  });

  describe('getStoredTokens', () => {
    it('returns null values when no tokens exist', () => {
      const tokens = getStoredTokens();
      expect(tokens).toEqual({
        accessToken: null,
        refreshToken: null,
      });
    });

    it('returns stored tokens when they exist', () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'test-access-token');
      localStorage.setItem(REFRESH_TOKEN_KEY, 'test-refresh-token');

      const tokens = getStoredTokens();
      expect(tokens).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });
    });
  });

  describe('setStoredTokens', () => {
    it('stores the provided tokens in localStorage', () => {
      setStoredTokens('new-access-token', 'new-refresh-token');

      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('new-access-token');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('new-refresh-token');
    });
  });

  describe('clearStoredTokens', () => {
    it('removes tokens from localStorage', () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'test-access-token');
      localStorage.setItem(REFRESH_TOKEN_KEY, 'test-refresh-token');

      clearStoredTokens();

      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    });
  });
});
