import { Platform } from 'react-native';

export const API_URL = __DEV__
    ? (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : `http://localhost:4000`)
    : 'https://api.yourdomain.com';
