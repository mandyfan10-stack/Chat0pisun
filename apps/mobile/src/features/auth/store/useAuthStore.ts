import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (user: User, token: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  signIn: async (user, token, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, token, isLoading: false });
  },

  signOut: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, token: null, isLoading: false });
  },

  restoreToken: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        set({ token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
