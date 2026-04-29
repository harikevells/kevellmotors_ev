import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend IP when running on a real device
// For Android emulator use: http://10.0.2.2:5001/api
// For iOS simulator use:    http://localhost:5001/api
// For real device use:      http://<your-machine-ip>:5001/api
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' ? 'http://192.168.0.129:5001/api' : 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
      // Navigation reset is handled in AuthContext listener
    }
    return Promise.reject(error);
  },
);

export default apiClient;
