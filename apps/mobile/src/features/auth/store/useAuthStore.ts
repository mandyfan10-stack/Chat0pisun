import { create } from 'zustand';
import type { User } from '../../chat/types';
import {
  apiRequest,
  type AuthResponse,
  setAuthFailureHandler,
  setSessionUpdateHandler,
} from '../../../shared/api/client';
import { clearStoredTokens, getStoredTokens, setStoredTokens } from '../../../shared/api/tokenStorage';

interface RegisterInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
  refresh: () => Promise<boolean>;
  updateProfile: (input: { displayName?: string; bio?: string }) => Promise<void>;
  uploadAvatar: (uri: string, type: string, name: string) => Promise<void>;
  clearSession: () => Promise<void>;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const applySession = async (session: AuthResponse) => {
  await setStoredTokens(session.accessToken, session.refreshToken);
  useAuthStore.setState({
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    error: null,
    isLoading: false,
  });
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isSubmitting: false,
  error: null,

  login: async (email, password) => {
    set({ isSubmitting: true, error: null });

    try {
      const session = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });
      await applySession(session);
    } catch (error) {
      set({ error: getErrorMessage(error, 'Login failed') });
      throw error;
    } finally {
      set({ isSubmitting: false, isLoading: false });
    }
  },

  register: async (input) => {
    set({ isSubmitting: true, error: null });

    try {
      const session = await apiRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
        skipAuth: true,
      });
      await applySession(session);
    } catch (error) {
      set({ error: getErrorMessage(error, 'Registration failed') });
      throw error;
    } finally {
      set({ isSubmitting: false, isLoading: false });
    }
  },

  logout: async () => {
    const { refreshToken } = await getStoredTokens();

    try {
      if (refreshToken) {
        await apiRequest<void>('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          skipRetry: true,
        });
      }
    } finally {
      await get().clearSession();
    }
  },

  restoreToken: async () => {
    set({ isLoading: true });

    const tokens = await getStoredTokens();

    if (!tokens.accessToken || !tokens.refreshToken) {
      set({ isLoading: false });
      return;
    }

    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    try {
      const response = await apiRequest<{ user: User }>('/api/auth/me');
      const nextTokens = await getStoredTokens();
      set({
        user: response.user,
        accessToken: nextTokens.accessToken,
        refreshToken: nextTokens.refreshToken,
        error: null,
      });
    } catch (error) {
      await get().clearSession();
      set({ error: getErrorMessage(error, 'Session expired') });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    const { refreshToken } = await getStoredTokens();

    if (!refreshToken) {
      return false;
    }

    try {
      const session = await apiRequest<AuthResponse>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
        skipRetry: true,
      });
      await applySession(session);
      return true;
    } catch {
      await get().clearSession();
      return false;
    }
  },

  updateProfile: async (input) => {
    set({ isSubmitting: true, error: null });

    try {
      const response = await apiRequest<{ user: User }>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      set({ user: response.user });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Update failed') });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  uploadAvatar: async (uri, type, name) => {
    set({ isSubmitting: true, error: null });

    try {
      const formData = new FormData();
      // @ts-ignore: React Native FormData needs this shape
      formData.append('avatar', {
        uri,
        type,
        name,
      });

      const response = await apiRequest<{ user: User }>('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      set({ user: response.user });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Avatar upload failed') });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  clearSession: async () => {
    await clearStoredTokens();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
    });
  },
}));

setSessionUpdateHandler((session) => {
  void applySession(session);
});

setAuthFailureHandler(() => {
  void useAuthStore.getState().clearSession();
});
