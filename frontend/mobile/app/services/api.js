import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API Configuration from environment or config
// Priority: 1. Environment variable 2. app.json extra config 3. Default localhost
export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  Constants.expoConfig?.extra?.apiUrl || 
  Constants.manifest?.extra?.apiUrl ||
  'https://wildlife-project-backend.onrender.com';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds - allows time for Render.com to wake up (free tier)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Note: Render.com free tier sleeps after inactivity and takes 30-60s to wake up on first request
// Subsequent requests are fast. Consider upgrading plan for always-on backend.

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          await AsyncStorage.setItem('authToken', access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('userProfile');
        // You might want to trigger a navigation to login screen here
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        isNetworkError: true,
      });
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Helper function to handle offline/online status
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health/');
    return response.data;
  } catch (error) {
    console.error('Server health check failed:', error);
    return null;
  }
};

export default api;

