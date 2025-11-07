import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
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
      console.warn('Backend timeout - Render.com may be waking up. This can take up to 2 minutes on first request.');
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


