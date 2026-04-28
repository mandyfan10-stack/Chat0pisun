import { API_URL } from '../../config/env';
import type { User } from '../../features/chat/types';
import { clearStoredTokens, getStoredTokens, setStoredTokens } from './tokenStorage';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRetry?: boolean;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<AuthResponse | null> | null = null;
let sessionUpdateHandler: ((session: AuthResponse) => void) | null = null;
let authFailureHandler: (() => void) | null = null;

export const setSessionUpdateHandler = (handler: (session: AuthResponse) => void) => {
  sessionUpdateHandler = handler;
};

export const setAuthFailureHandler = (handler: () => void) => {
  authFailureHandler = handler;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error?.message ?? 'Request failed';
    const code = data?.error?.code;
    throw new ApiError(response.status, message, code);
  }

  return data as T;
};

const refreshSession = async () => {
  const { refreshToken } = await getStoredTokens();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const session = await parseResponse<AuthResponse>(response);
  await setStoredTokens(session.accessToken, session.refreshToken);
  sessionUpdateHandler?.(session);

  return session;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { skipAuth, skipRetry, headers, ...fetchOptions } = options;
  const nextHeaders = new Headers(headers);

  if (!nextHeaders.has('Content-Type') && fetchOptions.body) {
    nextHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const { accessToken } = await getStoredTokens();

    if (accessToken) {
      nextHeaders.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: nextHeaders,
  });

  if (response.status === 401 && !skipAuth && !skipRetry) {
    try {
      refreshPromise ??= refreshSession().finally(() => {
        refreshPromise = null;
      });
      const session = await refreshPromise;

      if (session) {
        return apiRequest<T>(path, { ...options, skipRetry: true });
      }
    } catch {
      await clearStoredTokens();
      authFailureHandler?.();
    }
  }

  return parseResponse<T>(response);
};
