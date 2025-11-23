import api, { publicApi } from './api';

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_PROFILE_KEY = 'userProfile';

const auth = {
  sendRegistrationOTP: async ({ email, name, role = 'ranger' }) => {
    try {
      console.log('Sending Registration OTP...');
      console.log('   Email:', email);
      console.log('   Name:', name);
      console.log('   Role:', role);
      console.log('   API URL:', publicApi.defaults.baseURL);
      console.log('   Full URL:', `${publicApi.defaults.baseURL}/api/v1/auth/register/`);
      
      const response = await publicApi.post('/api/v1/auth/register/', {
        email,
        name,
        role,
      });

      console.log('OTP sent successfully!');
      console.log('   Response:', response.data);
      
      localStorage.setItem('pendingRegistration', JSON.stringify({
        email,
        name,
        role,
      }));

      return response.data;
    } catch (error) {
      console.error('Send Registration OTP FAILED');
      console.error('   Error status:', error.response?.status);
      console.error('   Error data:', error.response?.data);
      console.error('   API URL used:', publicApi.defaults.baseURL);
      console.error('   Request URL:', error.config?.url);
      console.error('   Full URL:', error.config?.baseURL + error.config?.url);
      console.error('   Full error:', error.message);
      
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

  verifyRegistrationOTP: async (email, otpCode) => {
    try {
      console.log('Verifying OTP:', { email, otpCode });
      
      const pendingData = localStorage.getItem('pendingRegistration');
      if (!pendingData) {
        throw new Error('Registration data not found. Please start registration again.');
      }

      const { name, role } = JSON.parse(pendingData);

      const response = await publicApi.post('/api/v1/auth/verify-otp/', {
        email,
        otp_code: otpCode,
        purpose: 'registration',
        name,
        role,
      });

      console.log('Registration completed:', response.data);

      const { user, tokens } = response.data;
      
      if (!tokens || !tokens.access || !tokens.refresh) {
        throw new Error('Invalid token response from server');
      }
      
      localStorage.setItem(TOKEN_KEY, tokens.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));

      localStorage.removeItem('pendingRegistration');

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

  register: async ({ phone, email, name, role = 'field_officer' }) => {
    return await auth.sendRegistrationOTP({ email, name, role });
  },

  sendLoginOTP: async (email) => {
    try {
      console.log('Sending Login OTP...');
      console.log('   Email:', email);
      console.log('   API URL:', publicApi.defaults.baseURL);
      console.log('   Full URL:', `${publicApi.defaults.baseURL}/api/v1/auth/login/`);
      
      const response = await publicApi.post('/api/v1/auth/login/', {
        email,
      });
      
      console.log('Login OTP sent successfully:', response.data);
      localStorage.setItem('pendingLogin', email);
      return response.data;
    } catch (error) {
      console.error('Send Login OTP FAILED');
      console.error('   Error status:', error.response?.status);
      console.error('   Error data:', error.response?.data);
      console.error('   API URL used:', publicApi.defaults.baseURL);
      console.error('   Request URL:', error.config?.url);
      console.error('   Full URL:', error.config?.baseURL + error.config?.url);
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to send OTP');
    }
  },

  verifyLoginOTP: async (email, otpCode) => {
    try {
      const response = await publicApi.post('/api/v1/auth/login/verify/', {
        email,
        otp_code: otpCode,
      });

      const { tokens, user } = response.data;
      const { access, refresh } = tokens;
      
      localStorage.setItem(TOKEN_KEY, access);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));

      return { token: access, user };
    } catch (error) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Login verification failed');
    }
  },

  login: async (email, password) => {
    return await auth.sendLoginOTP(email);
  },

  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
    localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_PROFILE_KEY);
    }
  },

  fetchProfile: async () => {
    try {
      const response = await api.get('/api/v1/auth/me/');
      const user = response.data;
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
      return user;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

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

  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await api.post('/api/v1/auth/refresh/', {
        refresh: refreshToken,
      });

      const { access } = response.data;
      localStorage.setItem(TOKEN_KEY, access);
      return access;
    } catch (error) {
      await auth.logout();
      throw new Error('Session expired. Please login again.');
    }
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),

  getProfile: () => {
    try {
      const profile = localStorage.getItem(USER_PROFILE_KEY);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/api/v1/auth/me/', profileData);
      const updatedUser = response.data;
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },
};

export default auth;
