/**
 * useOfflineMode Hook
 * Manages offline/online state and provides utilities for offline-first operations
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

// Lazy load offline services to prevent crashes on app startup
let offlineStorage = null;
let offlineMapTiles = null;

const getOfflineStorage = async () => {
  if (!offlineStorage) {
    try {
      offlineStorage = (await import('@services/offlineStorage')).default;
    } catch (error) {
      console.warn('Offline storage not available:', error);
      return null;
    }
  }
  return offlineStorage;
};

const getOfflineMapTiles = async () => {
  if (!offlineMapTiles) {
    try {
      offlineMapTiles = (await import('@services/offlineMapTiles')).default;
    } catch (error) {
      console.warn('Offline map tiles not available:', error);
      return null;
    }
  }
  return offlineMapTiles;
};

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState(null);
  const [offlineStats, setOfflineStats] = useState({
    unsyncedGPS: 0,
    unsyncedAlerts: 0,
    syncQueue: 0
  });

  // Update offline stats - defined before useEffect that uses it
  const updateOfflineStats = useCallback(async () => {
    try {
      const storage = await getOfflineStorage();
      if (!storage) return;
      const stats = await storage.getStorageStats();
      setOfflineStats(stats);
    } catch (error) {
      console.error('Failed to update offline stats:', error);
    }
  }, []);

  // Monitor network state - with error handling
  useEffect(() => {
    let unsubscribe = null;
    try {
      unsubscribe = NetInfo.addEventListener(state => {
        try {
          const online = state.isConnected && state.isInternetReachable;
          setIsOnline(online);
          setIsConnected(state.isConnected);
          setConnectionType(state.type);
          
          console.log(`🌐 Network state: ${online ? 'ONLINE' : 'OFFLINE'} (${state.type})`);
          
          // Update stats when going online
          if (online) {
            updateOfflineStats().catch(err => console.warn('Failed to update stats:', err));
            
            // Auto-sync queued data when coming back online
            import('@services/prioritySyncQueue').then(module => {
              const queue = module.default;
              queue.startAutoSync();
              console.log('🔄 Auto-sync started - syncing queued data');
            }).catch(err => console.warn('Failed to start auto-sync:', err));
          }
        } catch (error) {
          console.warn('Error in NetInfo listener:', error);
        }
      });

      // Get initial state
      NetInfo.fetch().then(state => {
        try {
          const online = state.isConnected && state.isInternetReachable;
          setIsOnline(online);
          setIsConnected(state.isConnected);
          setConnectionType(state.type);
        } catch (error) {
          console.warn('Error fetching initial network state:', error);
        }
      }).catch(error => {
        console.warn('Failed to fetch network state:', error);
      });
    } catch (error) {
      console.warn('Failed to setup network monitoring:', error);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from NetInfo:', error);
        }
      }
    };
  }, [updateOfflineStats]);

  // Update stats periodically - with error handling
  useEffect(() => {
    const updateStats = async () => {
      try {
        await updateOfflineStats();
      } catch (error) {
        console.warn('Failed to update offline stats:', error);
      }
    };
    updateStats();
    const interval = setInterval(updateStats, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [updateOfflineStats]);

  /**
   * Save data offline (GPS, alerts, etc.)
   */
  const saveOffline = useCallback(async (type, data) => {
    try {
      switch (type) {
        case 'gps':
          await offlineStorage.saveGPSLocation(data);
          break;
        case 'alert':
          await offlineStorage.saveAlert(data);
          break;
        case 'animal':
          await offlineStorage.saveAnimal(data);
          break;
        default:
          console.warn('Unknown offline save type:', type);
          return false;
      }
      
      await updateOfflineStats();
      return true;
    } catch (error) {
      console.error('Failed to save offline:', error);
      return false;
    }
  }, [updateOfflineStats]);

  /**
   * Download map tiles for offline use
   */
  const downloadMapTiles = useCallback(async (region, minZoom = 6, maxZoom = 14, onProgress = null) => {
    if (!isOnline) {
      console.warn('Cannot download tiles while offline');
      return { success: false, error: 'Offline' };
    }

    try {
      const tiles = await getOfflineMapTiles();
      if (!tiles) {
        return { success: false, error: 'Map tiles service not available' };
      }
      const result = await tiles.downloadTilesForRegion(
        region,
        minZoom,
        maxZoom,
        onProgress
      );
      return result;
    } catch (error) {
      console.error('Failed to download map tiles:', error);
      return { success: false, error: error.message };
    }
  }, [isOnline]);

  /**
   * Get cached map tiles URL template for react-native-maps
   */
  const getOfflineTileURL = useCallback(async (z, x, y) => {
    const tiles = await getOfflineMapTiles();
    if (!tiles) return null;
    return tiles.getLocalTileURL(z, x, y);
  }, []);

  /**
   * Check if tile exists offline
   */
  const tileExistsOffline = useCallback(async (z, x, y) => {
    const tiles = await getOfflineMapTiles();
    if (!tiles) return false;
    return await tiles.tileExists(z, x, y);
  }, []);

  return {
    // State
    isOnline,
    isConnected,
    connectionType,
    offlineStats,
    
    // Actions
    saveOffline,
    downloadMapTiles,
    getOfflineTileURL,
    tileExistsOffline,
    updateOfflineStats,
    
    // Utilities
    isOffline: !isOnline,
    isWifi: connectionType === 'wifi',
    isCellular: connectionType === 'cellular',
  };
};

export default useOfflineMode;

