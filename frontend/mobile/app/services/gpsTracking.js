import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rangers } from './index';

const GPS_QUEUE_KEY = '@gps_tracking_queue';
const RANGER_PROFILE_KEY = '@wildlife_ranger_profile';
const TRACKING_ACTIVE_KEY = '@gps_tracking_active';

// Store interval ID in memory (not AsyncStorage)
let trackingInterval = null;

// Save GPS point (try to send, queue if offline)
const saveGPSPoint = async (gpsData) => {
  try {
    // Get ranger profile
    const rangerProfileStr = await AsyncStorage.getItem(RANGER_PROFILE_KEY);
    if (!rangerProfileStr) {
      console.log('No ranger profile found, skipping GPS save');
      return;
    }

    const rangerProfile = JSON.parse(rangerProfileStr);
    
    const trackingData = {
      ranger: rangerProfile.id,
      ...gpsData,
      activity_type: 'patrolling',
      battery_level: '100%', // Get from device if possible
      signal_strength: 'Good',
    };

    // Try to send immediately
    try {
      await rangers.tracking.create(trackingData);
      console.log('GPS point sent successfully');
    } catch (error) {
      // If failed, queue for later
      console.log('Network error, queueing GPS point');
      await queueGPSPoint(trackingData);
    }
  } catch (error) {
    console.error('Failed to save GPS point:', error);
  }
};

// Queue GPS point for later sync
const queueGPSPoint = async (trackingData) => {
  try {
    const queueStr = await AsyncStorage.getItem(GPS_QUEUE_KEY);
    const queue = queueStr ? JSON.parse(queueStr) : [];
    queue.push(trackingData);
    
    // Keep only last 1000 points
    if (queue.length > 1000) {
      queue.splice(0, queue.length - 1000);
    }
    
    await AsyncStorage.setItem(GPS_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to queue GPS point:', error);
  }
};

const gpsTracking = {
  // Start foreground tracking with interval
  startTracking: async () => {
    try {
      // Check permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Clear any existing interval
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }

      // Send initial GPS point immediately
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        await saveGPSPoint({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          speed_kmh: (location.coords.speed || 0) * 3.6,
          directional_angle: location.coords.heading || 0,
          timestamp: new Date(location.timestamp).toISOString(),
        });
      } catch (error) {
        console.error('Initial GPS point failed:', error);
      }

      // Start interval-based tracking (5 minutes)
      trackingInterval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          await saveGPSPoint({
            lat: location.coords.latitude,
            lon: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            speed_kmh: (location.coords.speed || 0) * 3.6,
            directional_angle: location.coords.heading || 0,
            timestamp: new Date(location.timestamp).toISOString(),
          });
        } catch (error) {
          console.error('GPS tracking error:', error);
        }
      }, 300000); // 5 minutes

      // Mark as active
      await AsyncStorage.setItem(TRACKING_ACTIVE_KEY, 'true');

      console.log('GPS tracking started (every 5 minutes)');
      return { success: true };
    } catch (error) {
      console.error('Failed to start tracking:', error);
      throw error;
    }
  },

  // Stop tracking
  stopTracking: async () => {
    try {
      if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
        await AsyncStorage.removeItem(TRACKING_ACTIVE_KEY);
        console.log('GPS tracking stopped');
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      throw error;
    }
  },

  // Check if tracking is active
  isTracking: async () => {
    try {
      const active = await AsyncStorage.getItem(TRACKING_ACTIVE_KEY);
      return active === 'true' && trackingInterval !== null;
    } catch (error) {
      return false;
    }
  },

  // Get current location (one-time)
  getCurrentLocation: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        speed_kmh: (location.coords.speed || 0) * 3.6,
        heading: location.coords.heading,
        timestamp: new Date(location.timestamp).toISOString(),
      };
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw error;
    }
  },

  // Sync queued GPS points
  syncQueue: async () => {
    try {
      const queueStr = await AsyncStorage.getItem(GPS_QUEUE_KEY);
      if (!queueStr) {
        return { synced: 0, failed: 0 };
      }

      const queue = JSON.parse(queueStr);
      if (queue.length === 0) {
        return { synced: 0, failed: 0 };
      }

      console.log(`Syncing ${queue.length} queued GPS points...`);

      // Use bulk upload endpoint
      const result = await rangers.sync.upload({
        device_id: 'mobile-app',
        tracking: queue,
      });

      // Clear queue after successful sync
      await AsyncStorage.setItem(GPS_QUEUE_KEY, JSON.stringify([]));

      console.log('GPS queue synced:', result);
      return result;
    } catch (error) {
      console.error('Failed to sync GPS queue:', error);
      return { synced: 0, failed: queue.length };
    }
  },

  // Get queued points count
  getQueueCount: async () => {
    try {
      const queueStr = await AsyncStorage.getItem(GPS_QUEUE_KEY);
      if (!queueStr) return 0;
      const queue = JSON.parse(queueStr);
      return queue.length;
    } catch (error) {
      console.error('Failed to get queue count:', error);
      return 0;
    }
  },
};

export default gpsTracking;

