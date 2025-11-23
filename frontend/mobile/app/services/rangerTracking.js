/**
 * Ranger Tracking Service
 * Handles automatic GPS tracking and manual checkpoint check-ins
 * Integrates with priority sync queue for offline support
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { rangers } from './rangers';
// Don't import prioritySyncQueue at top level to prevent SSR issues
// Import it dynamically where needed
import AsyncStorage from '@react-native-async-storage/async-storage';

const RANGER_ID_KEY = 'ranger_id';
const TEAM_ID_KEY = 'team_id';
const TRACKING_ENABLED_KEY = 'tracking_enabled';

class RangerTrackingService {
  constructor() {
    this.isTracking = false;
    this.locationSubscription = null;
    this.lastLocation = null;
    this.distanceFilter = 50; // meters
    this.timeInterval = 30000; // 30 seconds
  }

  // Get ranger ID from storage
  async getRangerId() {
    try {
      const rangerId = await AsyncStorage.getItem(RANGER_ID_KEY);
      if (!rangerId) {
        // Try to get from auth service
        const auth = (await import('./auth')).default;
        const user = await auth.getCurrentUser();
        if (user && user.id) {
          await AsyncStorage.setItem(RANGER_ID_KEY, user.id);
          return user.id;
        }
      }
      return rangerId;
    } catch (error) {
      console.error('Failed to get ranger ID:', error);
      return null;
    }
  }

  // Get team ID from storage
  async getTeamId() {
    try {
      const teamId = await AsyncStorage.getItem(TEAM_ID_KEY);
      if (!teamId) {
        // Try to get from user profile
        const auth = (await import('./auth')).default;
        const user = await auth.getCurrentUser();
        if (user && user.team_id) {
          await AsyncStorage.setItem(TEAM_ID_KEY, user.team_id);
          return user.team_id;
        }
      }
      return teamId;
    } catch (error) {
      console.error('Failed to get team ID:', error);
      return null;
    }
  }

  // Get battery level (mock for now, can be enhanced with actual battery API)
  async getBatteryLevel() {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't have battery API easily accessible
        return '100%';
      }
      // For native, you could use expo-battery or react-native-device-info
      return '100%';
    } catch (error) {
      return 'Unknown';
    }
  }

  // Get signal strength (mock for now)
  async getSignalStrength() {
    try {
      const NetInfo = (await import('@react-native-community/netinfo')).default;
      const state = await NetInfo.fetch();
      if (state.type === 'wifi') {
        return 'Good';
      } else if (state.type === 'cellular') {
        return state.details?.cellularGeneration || 'Good';
      }
      return 'Good';
    } catch (error) {
      return 'Unknown';
    }
  }

  // Infer activity type from speed
  inferActivity(speed) {
    if (!speed || speed === 0) return 'stationary';
    
    const speedKmh = speed * 3.6; // Convert m/s to km/h
    
    if (speedKmh < 0.5) return 'resting';
    if (speedKmh < 2.0) return 'patrolling';
    if (speedKmh < 10.0) return 'traveling';
    return 'responding';
  }

  // Handle location update
  async handleLocationUpdate(location) {
    try {
      const rangerId = await this.getRangerId();
      if (!rangerId) {
        console.warn('No ranger ID available, skipping location update');
        return;
      }

      // Check if location changed significantly
      if (this.lastLocation) {
        const distance = this.calculateDistance(
          this.lastLocation.coords.latitude,
          this.lastLocation.coords.longitude,
          location.coords.latitude,
          location.coords.longitude
        );
        
        // Only send if moved more than distance filter
        if (distance < this.distanceFilter) {
          return;
        }
      }

      this.lastLocation = location;

      const trackingData = {
        ranger: rangerId,
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        altitude: location.coords.altitude || null,
        accuracy: location.coords.accuracy || null,
        speed_kmh: location.coords.speed ? location.coords.speed * 3.6 : 0,
        directional_angle: location.coords.heading || null,
        activity_type: this.inferActivity(location.coords.speed),
        battery_level: await this.getBatteryLevel(),
        signal_strength: await this.getSignalStrength(),
        timestamp: new Date(location.timestamp).toISOString(),
      };

      // Add to high-priority queue (lazy import to prevent SSR issues)
      const prioritySyncQueue = (await import('./prioritySyncQueue')).default;
      await prioritySyncQueue.add({
        data: trackingData,
        endpoint: '/api/v1/rangers/tracking/',
        priority: 'high',
        retryInterval: 5000,
        maxRetries: 20,
      });

      console.log('📍 Location queued for sync:', {
        lat: trackingData.lat,
        lon: trackingData.lon,
        activity: trackingData.activity_type,
      });

      // Try immediate sync if online
      const isOnline = await prioritySyncQueue.isOnline();
      if (isOnline) {
        await prioritySyncQueue.syncHighPriority();
      }
    } catch (error) {
      console.error('Failed to handle location update:', error);
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  // Start tracking
  async startTracking() {
    if (this.isTracking) {
      console.log('Tracking already started');
      return true;
    }

    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // Request background permission
      if (Platform.OS !== 'web') {
        const bgStatus = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus.status !== 'granted') {
          console.warn('Background location permission not granted');
        }
      }

      // Configure location options
      const locationOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: this.timeInterval,
        distanceInterval: this.distanceFilter,
        mayShowUserSettingsDialog: true,
      };

      // Start location updates
      this.locationSubscription = await Location.watchPositionAsync(
        locationOptions,
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      await AsyncStorage.setItem(TRACKING_ENABLED_KEY, 'true');
      
      // Start auto-sync (lazy import to prevent SSR issues)
      const prioritySyncQueue = (await import('./prioritySyncQueue')).default;
      prioritySyncQueue.startAutoSync();
      
      console.log('✅ Ranger tracking started');
      return true;
    } catch (error) {
      console.error('Failed to start tracking:', error);
      this.isTracking = false;
      return false;
    }
  }

  // Stop tracking
  async stopTracking() {
    if (!this.isTracking) {
      return;
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    this.isTracking = false;
    await AsyncStorage.setItem(TRACKING_ENABLED_KEY, 'false');
    
    // Stop auto-sync (lazy import to prevent SSR issues)
    const prioritySyncQueue = (await import('./prioritySyncQueue')).default;
    prioritySyncQueue.stopAutoSync();
    
    console.log('⏹️ Ranger tracking stopped');
  }

  // Check if tracking is enabled
  async isTrackingEnabled() {
    try {
      const enabled = await AsyncStorage.getItem(TRACKING_ENABLED_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  // Create manual checkpoint check-in
  async createCheckpoint(checkpointData) {
    try {
      const rangerId = await this.getRangerId();
      const teamId = await this.getTeamId();

      if (!rangerId) {
        throw new Error('Ranger ID not available');
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const logData = {
        ranger: rangerId,
        team: teamId,
        log_type: 'checkpoint',
        priority: 'medium',
        title: checkpointData.waypointName 
          ? `Checkpoint: ${checkpointData.waypointName}`
          : 'Checkpoint: Quick Check-in',
        description: checkpointData.notes || 
          (checkpointData.waypointName 
            ? `Ranger checked in at ${checkpointData.waypointName}`
            : 'Ranger checked in'),
        lat: location.coords.latitude,
        lon: location.coords.longitude,
        photo_url: checkpointData.photoUrl || null,
        notes: checkpointData.notes || null,
        timestamp: new Date().toISOString(),
      };

      // Try to send immediately if online (lazy import to prevent SSR issues)
      const prioritySyncQueue = (await import('./prioritySyncQueue')).default;
      const isOnline = await prioritySyncQueue.isOnline();
      if (isOnline) {
        try {
          await rangers.logs.create(logData);
          console.log('✅ Checkpoint sent immediately');
          return { success: true, synced: true };
        } catch (error) {
          // Queue if fails
          console.warn('Failed to send checkpoint, queuing:', error);
        }
      }

      // Queue for offline sync - prioritySyncQueue already imported above
      await prioritySyncQueue.add({
        data: logData,
        endpoint: '/api/v1/rangers/logs/',
        priority: 'medium',
        retryInterval: 10000,
        maxRetries: 10,
      });

      return { success: true, synced: false };
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
      throw error;
    }
  }

  // Quick check-in (no waypoint name)
  async quickCheckIn() {
    return await this.createCheckpoint({
      waypointName: 'Quick Check-in',
      notes: 'Quick check-in',
    });
  }
}

// Export singleton instance
const rangerTrackingService = new RangerTrackingService();

// Auto-start tracking if it was enabled before
rangerTrackingService.isTrackingEnabled().then((enabled) => {
  if (enabled) {
    rangerTrackingService.startTracking().catch(console.error);
  }
});

export default rangerTrackingService;

