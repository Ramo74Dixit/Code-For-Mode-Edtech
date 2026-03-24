import { Platform } from 'react-native';
import axios from 'axios';

// Logic to handle different environments
// 10.0.2.2 is for Android Emulator
// ngrok-free.dev is for Physical Device (Tunnel)
const DEV_BACKEND_URL = Platform.select({
  ios: 'http://localhost:5002',
  // android: 'http://10.0.2.2:5002',       // For Android Emulator
  android: 'http://172.17.7.1:5002',     // For Physical Device (Expo Go)
});

const API_BASE_URL = `${DEV_BACKEND_URL}/api`;

console.log('API_BASE_URL:', API_BASE_URL);

// Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
