import { Platform } from 'react-native';

const DEV_IP = '192.168.1.100';

export const API_URL = __DEV__
    ? (Platform.OS === 'web' || Platform.OS === 'ios' ? 'http://localhost:4000' : `http://10.0.2.2:4000`)
    : 'https://api.yourdomain.com';
