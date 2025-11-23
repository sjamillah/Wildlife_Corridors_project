import { useState, useEffect } from 'react';
import { auth } from '@services';

/**
 * Custom hook for authentication
 * Usage:
 *   const { user, isAuthenticated, loading, login, logout } = useAuth();
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const authStatus = await auth.isAuthenticated();
      setIsAuthenticated(authStatus);

      if (authStatus) {
        const profile = await auth.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, otpCode, otpId) => {
    try {
      const { user: userData } = await auth.verifyLoginOTP(email, otpCode, otpId);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      throw error;
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await auth.fetchProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshProfile,
    checkAuthStatus,
  };
};

export default useAuth;

