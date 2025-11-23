import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API Configuration from environment or config
// Priority: 1. Environment variable 2. app.json extra config 3. Default fallback
export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  Constants.expoConfig?.extra?.apiUrl || 
  Constants.manifest?.extra?.apiUrl ||
  'https://wildlife-project-backend.onrender.com';

// Log the API URL being used (helps debug production issues)
console.log('API Configuration:');
console.log('   EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('   app.json apiUrl:', Constants.expoConfig?.extra?.apiUrl);
console.log('   Using API URL:', API_BASE_URL);

// Validate that API_BASE_URL is set
if (!API_BASE_URL || API_BASE_URL === 'undefined' || API_BASE_URL === 'null') {
  console.error('CRITICAL: API URL is not configured!');
  console.error('   Current value:', API_BASE_URL);
  console.error('   Please set EXPO_PUBLIC_API_URL or configure apiUrl in app.json');
  console.error('   Example in app.json: "extra": { "apiUrl": "https://wildlife-project-backend.onrender.com" }');
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds - increased for Render.com free tier cold starts (30-60s wake up time)
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
      // Silently fail if AsyncStorage is unavailable (e.g., during app initialization)
      // This prevents crashes in Expo Go during development
      if (__DEV__) {
        console.warn('Could not get auth token (non-critical):', error.message);
      }
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
          }, {
            timeout: 60000, // 60 seconds - same as main API timeout
          });

          const { access } = response.data;
          await AsyncStorage.setItem('authToken', access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        try {
          await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userProfile']);
        } catch (storageError) {
          // Silently fail if AsyncStorage is unavailable
          if (__DEV__) {
            console.warn('Could not clear tokens (non-critical):', storageError.message);
          }
        }
        // Return a user-friendly error instead of the raw refresh error
        return Promise.reject({
          message: 'Session expired. Please login again.',
          isAuthError: true,
          originalError: refreshError,
        });
      }
    }

    // Handle network errors and timeouts
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      const isPrematureClose = error.code === 'ECONNRESET' || 
                               error.message?.includes('Premature close') ||
                               error.message?.includes('socket hang up') ||
                               error.message?.includes('aborted');
      
      // Log error details for debugging (but don't spam in production)
      if (__DEV__) {
        console.error('Network error:', {
          message: error.message,
          code: error.code,
          isTimeout,
          isPrematureClose,
        });
      }
      
      if (isTimeout) {
        return Promise.reject({
          message: 'Request timed out. The server may be starting up. Please try again.',
          isTimeout: true,
          isNetworkError: true,
        });
      }
      
      if (isPrematureClose) {
        // Handle premature close gracefully - often happens with slow connections or server issues
        return Promise.reject({
          message: 'Connection was interrupted. Please check your internet connection and try again.',
          isPrematureClose: true,
          isNetworkError: true,
        });
      }
      
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

