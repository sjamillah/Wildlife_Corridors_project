import { useState, useEffect } from 'react';
import { sync } from '@services';
import NetInfo from '@react-native-community/netinfo';

/**
 * Custom hook for offline sync management
 * Usage:
 *   const { queueSize, isOnline, syncData, addToQueue } = useSync();
 */
export const useSync = () => {
  const [queueSize, setQueueSize] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      
      // Auto-sync when coming online
      if (state.isConnected && queueSize > 0) {
        autoSync();
      }
    });

    // Initial queue check
    checkQueueSize();

    return () => unsubscribe();
  }, []);

  const checkQueueSize = async () => {
    try {
      const queue = await sync.getLocalQueue();
      setQueueSize(queue.length);
    } catch (error) {
      console.error('Error checking queue:', error);
    }
  };

  const addToQueue = async (type, data) => {
    try {
      const result = await sync.addToLocalQueue({ type, data });
      setQueueSize(result.queueSize);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const autoSync = async () => {
    try {
      setSyncing(true);
      const result = await sync.autoSync();
      if (result.success) {
        setQueueSize(0);
        setLastSyncTime(new Date());
      }
      return result;
    } catch (error) {
      console.error('Auto-sync error:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      const result = await sync.syncLocalQueue();
      if (result.success) {
        setQueueSize(0);
        setLastSyncTime(new Date());
      }
      return result;
    } catch (error) {
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  return {
    queueSize,
    isOnline,
    syncing,
    lastSyncTime,
    syncData,
    addToQueue,
    autoSync,
    checkQueueSize,
  };
};

export default useSync;

