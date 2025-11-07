import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const TRACKING_QUEUE_KEY = 'offline_tracking_queue';
const OBSERVATIONS_QUEUE_KEY = 'offline_observations_queue';

const offlineSync = {
  // Save tracking data to offline queue
  saveTrackingOffline: async (trackingData) => {
    try {
      const queue = await offlineSync.getTrackingQueue();
      const newItem = {
        ...trackingData,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: trackingData.timestamp || new Date().toISOString(),
        synced: false,
        createdAt: new Date().toISOString(),
      };
      queue.push(newItem);
      await AsyncStorage.setItem(TRACKING_QUEUE_KEY, JSON.stringify(queue));
      return { success: true, queueSize: queue.length };
    } catch (error) {
      console.error('Error saving tracking data offline:', error);
      throw error;
    }
  },

  // Save observation to offline queue
  saveObservationOffline: async (observationData) => {
    try {
      const queue = await offlineSync.getObservationsQueue();
      const newItem = {
        ...observationData,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        observed_at: observationData.observed_at || new Date().toISOString(),
        synced: false,
        createdAt: new Date().toISOString(),
      };
      queue.push(newItem);
      await AsyncStorage.setItem(OBSERVATIONS_QUEUE_KEY, JSON.stringify(queue));
      return { success: true, queueSize: queue.length };
    } catch (error) {
      console.error('Error saving observation offline:', error);
      throw error;
    }
  },

  // Get tracking queue
  getTrackingQueue: async () => {
    try {
      const queueData = await AsyncStorage.getItem(TRACKING_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error getting tracking queue:', error);
      return [];
    }
  },

  // Get observations queue
  getObservationsQueue: async () => {
    try {
      const queueData = await AsyncStorage.getItem(OBSERVATIONS_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error getting observations queue:', error);
      return [];
    }
  },

  // Get unsynced tracking data
  getUnsyncedTracking: async () => {
    try {
      const queue = await offlineSync.getTrackingQueue();
      return queue.filter(item => !item.synced);
    } catch (error) {
      console.error('Error getting unsynced tracking:', error);
      return [];
    }
  },

  // Get unsynced observations
  getUnsyncedObservations: async () => {
    try {
      const queue = await offlineSync.getObservationsQueue();
      return queue.filter(item => !item.synced);
    } catch (error) {
      console.error('Error getting unsynced observations:', error);
      return [];
    }
  },

  // Sync all offline data with backend
  syncAllData: async () => {
    try {
      const trackingQueue = await offlineSync.getUnsyncedTracking();
      const observationsQueue = await offlineSync.getUnsyncedObservations();

      let syncedCount = 0;
      const errors = [];

      // Sync tracking data
      for (const item of trackingQueue) {
        try {
          await api.post('/api/v1/tracking/', {
            animal: item.animal,
            lat: item.lat,
            lon: item.lon,
            altitude_m: item.altitude_m,
            speed_kmh: item.speed_kmh,
            heading: item.heading,
            accuracy_m: item.accuracy_m,
            battery_level: item.battery_level,
            timestamp: item.timestamp,
          });
          
          // Mark as synced
          await offlineSync.markTrackingSynced(item.id);
          syncedCount++;
        } catch (error) {
          errors.push({
            type: 'tracking',
            id: item.id,
            error: error.message,
          });
        }
      }

      // Sync observations
      for (const item of observationsQueue) {
        try {
          await api.post('/api/v1/tracking/observations/', {
            animal: item.animal,
            observation_type: item.observation_type,
            description: item.description,
            lat: item.lat,
            lon: item.lon,
            observed_at: item.observed_at,
            behavior: item.behavior,
          });
          
          // Mark as synced
          await offlineSync.markObservationSynced(item.id);
          syncedCount++;
        } catch (error) {
          errors.push({
            type: 'observation',
            id: item.id,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        synced: syncedCount,
        total: trackingQueue.length + observationsQueue.length,
        errors: errors.length > 0 ? errors : null,
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        message: error.message,
        synced: 0,
      };
    }
  },

  // Mark tracking item as synced
  markTrackingSynced: async (itemId) => {
    try {
      const queue = await offlineSync.getTrackingQueue();
      const updatedQueue = queue.map(item => 
        item.id === itemId ? { ...item, synced: true, syncedAt: new Date().toISOString() } : item
      );
      await AsyncStorage.setItem(TRACKING_QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error marking tracking as synced:', error);
    }
  },

  // Mark observation as synced
  markObservationSynced: async (itemId) => {
    try {
      const queue = await offlineSync.getObservationsQueue();
      const updatedQueue = queue.map(item => 
        item.id === itemId ? { ...item, synced: true, syncedAt: new Date().toISOString() } : item
      );
      await AsyncStorage.setItem(OBSERVATIONS_QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error marking observation as synced:', error);
    }
  },

  // Get sync statistics
  getSyncStats: async () => {
    try {
      const trackingQueue = await offlineSync.getTrackingQueue();
      const observationsQueue = await offlineSync.getObservationsQueue();

      const unsyncedTracking = trackingQueue.filter(item => !item.synced);
      const unsyncedObservations = observationsQueue.filter(item => !item.synced);

      return {
        total_tracking: trackingQueue.length,
        unsynced_tracking: unsyncedTracking.length,
        synced_tracking: trackingQueue.length - unsyncedTracking.length,
        total_observations: observationsQueue.length,
        unsynced_observations: unsyncedObservations.length,
        synced_observations: observationsQueue.length - unsyncedObservations.length,
        total_unsynced: unsyncedTracking.length + unsyncedObservations.length,
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {
        total_tracking: 0,
        unsynced_tracking: 0,
        synced_tracking: 0,
        total_observations: 0,
        unsynced_observations: 0,
        synced_observations: 0,
        total_unsynced: 0,
      };
    }
  },

  // Clear synced data (cleanup)
  clearSyncedData: async () => {
    try {
      const trackingQueue = await offlineSync.getTrackingQueue();
      const observationsQueue = await offlineSync.getObservationsQueue();

      const unsyncedTracking = trackingQueue.filter(item => !item.synced);
      const unsyncedObservations = observationsQueue.filter(item => !item.synced);

      await AsyncStorage.setItem(TRACKING_QUEUE_KEY, JSON.stringify(unsyncedTracking));
      await AsyncStorage.setItem(OBSERVATIONS_QUEUE_KEY, JSON.stringify(unsyncedObservations));

      return { success: true };
    } catch (error) {
      console.error('Error clearing synced data:', error);
      throw error;
    }
  },

  // Clear all offline data (reset)
  clearAllData: async () => {
    try {
      await AsyncStorage.removeItem(TRACKING_QUEUE_KEY);
      await AsyncStorage.removeItem(OBSERVATIONS_QUEUE_KEY);
      return { success: true };
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },
};

export default offlineSync;

