import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'chat0pisun.accessToken';
const REFRESH_TOKEN_KEY = 'chat0pisun.refreshToken';

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

const getWebStorage = () => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage;
};

export const getStoredTokens = async (): Promise<StoredTokens> => {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();

    return {
      accessToken: storage?.getItem(ACCESS_TOKEN_KEY) ?? null,
      refreshToken: storage?.getItem(REFRESH_TOKEN_KEY) ?? null,
    };
  }

  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  return { accessToken, refreshToken };
};

export const setStoredTokens = async (accessToken: string, refreshToken: string) => {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();
    storage?.setItem(ACCESS_TOKEN_KEY, accessToken);
    storage?.setItem(REFRESH_TOKEN_KEY, refreshToken);
    return;
  }

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
};

export const clearStoredTokens = async () => {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();
    storage?.removeItem(ACCESS_TOKEN_KEY);
    storage?.removeItem(REFRESH_TOKEN_KEY);
    return;
  }

  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
};
