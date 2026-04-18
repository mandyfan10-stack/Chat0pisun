import { Platform } from 'react-native';

// UPDATE THIS TO YOUR COMPUTER'S LOCAL IP (e.g. 192.168.x.x) FOR TESTING ON PHYSICAL DEVICES
const DEV_IP = '192.168.1.100';

export const API_URL = __DEV__
    ? (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : `http://${DEV_IP}:4000`)
    : 'https://api.yourdomain.com';
