import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  api,
  getStoredTokens,
  setStoredTokens,
  clearStoredTokens,
  API_URL
} from './api';

describe('API Service', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('Token Management', () => {
    it('should set and get stored tokens', () => {
      setStoredTokens('test-access', 'test-refresh');
      const tokens = getStoredTokens();
      expect(tokens.accessToken).toBe('test-access');
      expect(tokens.refreshToken).toBe('test-refresh');
    });

    it('should clear stored tokens', () => {
      setStoredTokens('test-access', 'test-refresh');
      clearStoredTokens();
      const tokens = getStoredTokens();
      expect(tokens.accessToken).toBeNull();
      expect(tokens.refreshToken).toBeNull();
    });
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header if access token exists', async () => {
      const accessToken = 'test-access-token';
      setStoredTokens(accessToken, 'test-refresh-token');

      mock.onGet('/test-endpoint').reply(200);

      const response = await api.get('/test-endpoint');

      expect(response.config.headers?.Authorization).toBe(`Bearer ${accessToken}`);
    });

    it('should not add Authorization header if access token does not exist', async () => {
      mock.onGet('/test-endpoint').reply(200);

      const response = await api.get('/test-endpoint');

      expect(response.config.headers?.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor (Token Refresh)', () => {
    it('should retry original request with new token on 401 error', async () => {
      const initialAccessToken = 'initial-access-token';
      const initialRefreshToken = 'initial-refresh-token';
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      setStoredTokens(initialAccessToken, initialRefreshToken);

      // Setup the mock for the token refresh endpoint
      const refreshMock = new MockAdapter(axios);
      refreshMock.onPost(`${API_URL}/auth/refresh`).reply(200, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      // Initially fail with 401, then succeed with 200 on retry
      mock.onGet('/test-auth-endpoint')
        .replyOnce(401)
        .onGet('/test-auth-endpoint')
        .reply(200);

      const response = await api.get('/test-auth-endpoint');

      // Verify the new token was used in the retried request
      expect(response.config.headers?.Authorization).toBe(`Bearer ${newAccessToken}`);

      // Verify localStorage was updated
      const tokens = getStoredTokens();
      expect(tokens.accessToken).toBe(newAccessToken);
      expect(tokens.refreshToken).toBe(newRefreshToken);

      refreshMock.restore();
    });

    it('should clear tokens and call auth failure handler if refresh fails', async () => {
      setStoredTokens('test-access', 'test-refresh');

      const refreshMock = new MockAdapter(axios);
      refreshMock.onPost(`${API_URL}/auth/refresh`).reply(401);

      mock.onGet('/test-auth-endpoint').reply(401);

      const { setAuthFailureHandler } = await import('./api');
      const mockHandler = vi.fn();
      setAuthFailureHandler(mockHandler);

      try {
        await api.get('/test-auth-endpoint');
      } catch {
        // Expected to throw
      }

      const tokens = getStoredTokens();
      expect(tokens.accessToken).toBeNull();
      expect(tokens.refreshToken).toBeNull();
      expect(mockHandler).toHaveBeenCalled();

      refreshMock.restore();
    });
  });
});
