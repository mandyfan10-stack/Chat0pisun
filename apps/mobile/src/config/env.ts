import { Platform } from 'react-native';

declare const process: {
  env?: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const configuredApiUrl = process.env?.EXPO_PUBLIC_API_URL;

export const API_URL =
  configuredApiUrl ||
  (__DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:4000'
      : 'http://localhost:4000'
    : 'https://api.yourdomain.com');
