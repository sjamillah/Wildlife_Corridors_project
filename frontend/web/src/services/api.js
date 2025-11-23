import axios from 'axios';

// Get API URL from environment variable
export const API_BASE_URL = process.env.REACT_APP_API_URL;

// Log the API URL being used (helps debug production issues)
console.log('API Configuration:');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Using API URL:', API_BASE_URL);

// Validate that API_BASE_URL is set
if (!API_BASE_URL || API_BASE_URL === 'undefined' || API_BASE_URL === 'null') {
  console.error('CRITICAL: REACT_APP_API_URL is not set!');
  console.error('Current value:', API_BASE_URL);
  console.error('Please set REACT_APP_API_URL in your deployment environment variables');
  console.error('Example: REACT_APP_API_URL=https://wildlife-project-backend.onrender.com');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds - fast timeout for better UX (users won't wait 90s)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && token !== 'undefined' && token !== 'null' && token.length > 20) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn('Request timeout - please check your connection');
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('authToken', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userProfile');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        isNetworkError: true,
      });
    }

    return Promise.reject(error);
  }
);

export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health/');
    return response.data;
  } catch (error) {
    console.error('Server health check failed:', error);
    return null;
  }
};

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 150000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default api;


