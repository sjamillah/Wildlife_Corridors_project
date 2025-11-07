import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_PROFILE_KEY = 'userProfile';

const auth = {
  // Send OTP for registration (EMAIL-based)
  sendRegistrationOTP: async ({ phone, email, name, password, role = 'ranger' }) => {
    try {
      console.log('Sending OTP request:', { email, name, role });
      console.log('API Base URL:', api.defaults.baseURL);
      
      // Backend sends OTP to EMAIL via /register/ endpoint
      const response = await api.post('/api/v1/auth/register/', {
        email,
        name,
        role,
      });

      console.log('OTP sent successfully:', response.data);
      
      // Store registration data temporarily for after OTP verification
      await AsyncStorage.setItem('pendingRegistration', JSON.stringify({
        email,
        name,
        role,
      }));

      return response.data; // { message, otp_id, expires_in }
    } catch (error) {
      console.error('Send OTP error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorData = error.response?.data;
      let errorMessage = 'Failed to send OTP';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  // Verify OTP and complete registration (EMAIL-based, 4-digit code)
  verifyRegistrationOTP: async (email, code, otpId) => {
    try {
      console.log('Verifying OTP:', { email, code });
      
      // Get pending registration data
      const pendingData = await AsyncStorage.getItem('pendingRegistration');
      if (!pendingData) {
        throw new Error('Registration data not found. Please start registration again.');
      }

      const { name, role } = JSON.parse(pendingData);

      // Verify OTP and create user in one call
      const verifyResponse = await api.post('/api/v1/auth/verify-otp/', {
        email,
        otp_code: code,
        purpose: 'registration',
        name,
        role,
      });

      console.log('OTP verified and user created:', verifyResponse.data);

      // Backend returns { user, tokens: { access, refresh } }
      const { user, tokens } = verifyResponse.data;
      
      if (!tokens || !tokens.access || !tokens.refresh) {
        throw new Error('Invalid token response from server');
      }
      
      // Store tokens and user profile
      await AsyncStorage.setItem(TOKEN_KEY, tokens.access);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));

      // Clear pending registration data
      await AsyncStorage.removeItem('pendingRegistration');

      return { token: tokens.access, user };
    } catch (error) {
      console.error('Registration verification error:', error.response?.data);
      
      const errorData = error.response?.data;
      let errorMessage = 'Registration failed';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n');
        }
      }
      
      throw new Error(errorMessage);
    }
  },

  // Login with email (sends OTP)
  login: async (email) => {
    try {
      console.log('Sending login OTP to:', email);
      console.log('API Base URL:', api.defaults.baseURL);
      
      const response = await api.post('/api/v1/auth/login/', {
        email,
      });

      console.log('Login OTP sent:', response.data);
      
      // Store email for OTP verification
      await AsyncStorage.setItem('pendingLogin', email);

      return response.data; // { message, otp_id, expires_in }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed');
    }
  },

  // Verify login OTP
  verifyLoginOTP: async (email, code, otpId) => {
    try {
      console.log('Verifying login OTP:', { email, code });
      
      const response = await api.post('/api/v1/auth/login/verify/', {
        email,
        otp_code: code,
      });

      console.log('Login verified:', response.data);

      const { tokens, user } = response.data;
      const { access, refresh } = tokens;
      
      // Store tokens and user profile
      await AsyncStorage.setItem(TOKEN_KEY, access);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));

      // Clear pending login
      await AsyncStorage.removeItem('pendingLogin');

      return { token: access, user };
    } catch (error) {
      console.error('Login verification error:', error.response?.data);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Invalid OTP code');
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout/');
    } catch (error) {
      console.error('Logout API call error (non-critical):', error);
    }
    
    // Clear local storage regardless of API call result
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_PROFILE_KEY]);
      console.log('AsyncStorage cleared successfully');
    } catch (storageError) {
      console.error('Failed to clear AsyncStorage:', storageError);
      // Try removing items individually as fallback
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
    }
  },

  // Get current user profile from server
  fetchProfile: async () => {
    try {
      const response = await api.get('/api/v1/auth/me/');
      const user = response.data;
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await api.post('/api/v1/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  },

  // Refresh JWT token
  refreshToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await api.post('/api/v1/auth/refresh/', {
        refresh: refreshToken,
      });

      const { access } = response.data;
      await AsyncStorage.setItem(TOKEN_KEY, access);
      return access;
    } catch (error) {
      // If refresh fails, clear everything
      await auth.logout();
      throw new Error('Session expired. Please login again.');
    }
  },

  // Get stored token
  getToken: async () => AsyncStorage.getItem(TOKEN_KEY),

  // Check if user is authenticated
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },

  // Get cached user profile
  getProfile: async () => {
    try {
      const profile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  },
};

export default auth;
