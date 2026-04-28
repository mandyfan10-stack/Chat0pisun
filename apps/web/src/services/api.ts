import axios, { type InternalAxiosRequestConfig } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

const ACCESS_TOKEN_KEY = 'chat0pisun.accessToken';
const REFRESH_TOKEN_KEY = 'chat0pisun.refreshToken';

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;
let authFailureHandler: (() => void) | null = null;

export const api = axios.create({
  baseURL: API_URL,
});

export const getStoredTokens = () => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
});

export const setStoredTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearStoredTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const setAuthFailureHandler = (handler: () => void) => {
  authFailureHandler = handler;
};

const refreshAccessToken = async () => {
  const { refreshToken } = getStoredTokens();

  if (!refreshToken) {
    return null;
  }

  const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  const nextAccessToken = response.data.accessToken as string;
  const nextRefreshToken = response.data.refreshToken as string;

  setStoredTokens(nextAccessToken, nextRefreshToken);
  return nextAccessToken;
};

api.interceptors.request.use((config) => {
  const { accessToken } = getStoredTokens();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;

      if (!accessToken) {
        throw new Error('Missing refresh token');
      }

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearStoredTokens();
      authFailureHandler?.();
      return Promise.reject(refreshError);
    }
  },
);
