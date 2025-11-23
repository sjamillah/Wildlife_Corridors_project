import { router } from 'expo-router';
import { Alert } from 'react-native';

/**
 * Safely navigate to a route with error handling
 * Prevents app crashes from navigation errors
 */
export const safeNavigate = (route, options = {}) => {
  try {
    if (!route) {
      console.warn('Navigation: No route provided');
      return;
    }
    
    const { method = 'push', delay = 0 } = options;
    
    const navigate = () => {
      try {
        if (method === 'replace') {
          router.replace(route);
        } else {
          router.push(route);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        if (options.showError !== false) {
          Alert.alert('Navigation Error', 'Unable to navigate. Please try again.');
        }
      }
    };
    
    if (delay > 0) {
      setTimeout(navigate, delay);
    } else {
      navigate();
    }
  } catch (error) {
    console.error('Safe navigation error:', error);
    if (options.showError !== false) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }
};

