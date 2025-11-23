import NetInfo from '@react-native-community/netinfo';
import { sync } from '@services';

/**
 * Network monitoring utility
 * Provides helper functions for monitoring network status and auto-sync
 */

let networkUnsubscribe = null;
let isMonitoring = false;

/**
 * Start monitoring network status and auto-sync when coming online
 * @param {Function} onStatusChange - Callback when network status changes
 * @returns {Function} Cleanup function to stop monitoring
 */
export const startNetworkMonitoring = (onStatusChange = null) => {
  if (isMonitoring) {
    console.warn('Network monitoring already started');
    return stopNetworkMonitoring;
  }

  let wasOffline = false;

  networkUnsubscribe = NetInfo.addEventListener(async (state) => {
    const isOnline = state.isConnected;
    
    console.log('Network status:', {
      isConnected: state.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    });

    // Notify callback if provided
    if (onStatusChange) {
      onStatusChange(isOnline, state);
    }

    // Auto-sync when coming back online
    if (isOnline && wasOffline) {
      console.log('Connection restored - attempting auto-sync...');
      try {
        const result = await sync.autoSync();
        if (result.success && result.synced > 0) {
          console.log(`Auto-synced ${result.synced} items successfully`);
        }
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }

    wasOffline = !isOnline;
  });

  isMonitoring = true;
  console.log('Network monitoring started');

  return stopNetworkMonitoring;
};

/**
 * Stop monitoring network status
 */
export const stopNetworkMonitoring = () => {
  if (networkUnsubscribe) {
    networkUnsubscribe();
    networkUnsubscribe = null;
    isMonitoring = false;
    console.log('Network monitoring stopped');
  }
};

/**
 * Get current network status
 * @returns {Promise<Object>} Network state
 */
export const getNetworkStatus = async () => {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    };
  } catch (error) {
    console.error('Error getting network status:', error);
    return {
      isConnected: false,
      isInternetReachable: false,
      type: 'unknown',
      details: null,
    };
  }
};

/**
 * Check if device is online
 * @returns {Promise<boolean>} True if online
 */
export const isOnline = async () => {
  const status = await getNetworkStatus();
  return status.isConnected;
};

/**
 * Wait until device is online
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 30000)
 * @returns {Promise<boolean>} True if online, false if timeout
 */
export const waitForOnline = (timeout = 30000) => {
  return new Promise((resolve) => {
    const checkInterval = 1000; // Check every second
    let elapsed = 0;

    const interval = setInterval(async () => {
      const online = await isOnline();
      
      if (online) {
        clearInterval(interval);
        resolve(true);
      } else if (elapsed >= timeout) {
        clearInterval(interval);
        resolve(false);
      }
      
      elapsed += checkInterval;
    }, checkInterval);
  });
};

/**
 * Execute function with network check
 * If offline, queue for later execution
 * @param {Function} fn - Async function to execute
 * @param {Object} fallbackData - Data to queue if offline
 * @returns {Promise<any>} Result of function or queued status
 */
export const executeWithNetworkCheck = async (fn, fallbackData = null) => {
  const online = await isOnline();
  
  if (online) {
    try {
      return await fn();
    } catch (error) {
      // If function fails due to network error, queue it
      if (error.isNetworkError && fallbackData) {
        console.log('Network error - queuing for later sync');
        await sync.addToLocalQueue(fallbackData);
        return { queued: true, message: 'Queued for sync' };
      }
      throw error;
    }
  } else {
    // Offline - queue for later
    if (fallbackData) {
      console.log('Offline - queuing for later sync');
      await sync.addToLocalQueue(fallbackData);
      return { queued: true, message: 'Queued for sync when online' };
    }
    throw new Error('No internet connection');
  }
};

export default {
  startNetworkMonitoring,
  stopNetworkMonitoring,
  getNetworkStatus,
  isOnline,
  waitForOnline,
  executeWithNetworkCheck,
};


