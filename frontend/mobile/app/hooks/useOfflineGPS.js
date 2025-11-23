/**
 * useOfflineGPS Hook
 * Handles GPS tracking with offline storage and background location
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { useOfflineMode } from './useOfflineMode';

// Lazy load offline storage
const getOfflineStorage = async () => {
  try {
    const storage = await import('@services/offlineStorage');
    return storage.default;
  } catch (error) {
    console.warn('Offline storage not available:', error);
    return null;
  }
};

const DEFAULT_OPTIONS = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 5000, // 5 seconds
  distanceInterval: 10, // 10 meters
  enableHighAccuracy: false,
};

export const useOfflineGPS = (options = {}) => {
  // Get offline mode - it handles errors internally
  const { isOnline, saveOffline } = useOfflineMode();
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const locationSubscriptionRef = useRef(null);
  const optionsRef = useRef({ ...DEFAULT_OPTIONS, ...options });

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setError('Location permission not granted');
        return false;
      }

      // Request background permission if needed
      if (optionsRef.current.enableBackground) {
        const bgStatus = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus.status !== 'granted') {
          console.warn('Background location permission not granted');
        }
      }

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Save location offline
  const saveLocation = useCallback(async (loc) => {
    try {
      const locationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        altitude: loc.coords.altitude,
        heading: loc.coords.heading,
        speed: loc.coords.speed,
      };

      // Always save offline (will sync when online)
      const saved = await saveOffline('gps', locationData);
      if (!saved) {
        // Fallback: try direct storage access
        const storage = await getOfflineStorage();
        if (storage) {
          await storage.saveGPSLocation(locationData);
        }
      }
      
      return true;
    } catch (err) {
      console.error('Failed to save location:', err);
      return false;
    }
  }, [saveOffline]);

  // Start tracking
  const startTracking = useCallback(async () => {
    try {
      // Request permissions first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setError('Location permission required');
        return false;
      }

      // Configure location options
      const locationOptions = {
        accuracy: optionsRef.current.accuracy,
        timeInterval: optionsRef.current.timeInterval,
        distanceInterval: optionsRef.current.distanceInterval,
        mayShowUserSettingsDialog: true,
      };

      // Start location updates
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        locationOptions,
        (loc) => {
          setLocation(loc);
          setError(null);
          
          // Save location offline
          saveLocation(loc);
        }
      );

      setIsTracking(true);
      console.log('📍 GPS tracking started');
      return true;
    } catch (err) {
      setError(err.message);
      setIsTracking(false);
      return false;
    }
  }, [requestPermissions, saveLocation]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    setIsTracking(false);
    console.log('📍 GPS tracking stopped');
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: optionsRef.current.accuracy,
      });

      setLocation(loc);
      await saveLocation(loc);
      
      return loc;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [requestPermissions, saveLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, []);

  return {
    // State
    location,
    error,
    isTracking,
    permissionStatus,
    
    // Actions
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermissions,
  };
};

export default useOfflineGPS;

