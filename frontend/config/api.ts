import Constants from 'expo-constants';

// Automatically get the local IP from Expo
const getLocalIP = () => {
  const { expoConfig } = Constants;
  const debuggerHost = expoConfig?.hostUri;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }
  return 'localhost';
};

// Use environment-based API URL
export const API_URL = __DEV__ 
  ? `http://${getLocalIP()}:8000`  // Development - auto-detect IP
  : 'https://your-production-api.com';  // Production

export default API_URL;
