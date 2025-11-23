import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STATUS_COLORS } from '@constants/Colors';
import { alerts as alertsService } from '@services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const AlertsContext = createContext();

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertsProvider');
  }
  return context;
};

// Helper functions moved outside component to ensure stability
const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const getIconForAlertType = (type) => {
  const typeLower = String(type || '').toLowerCase();
  if (typeLower.includes('poaching')) return 'shield-alert';
  if (typeLower.includes('equipment') || typeLower.includes('battery')) return 'wrench';
  if (typeLower.includes('temperature')) return 'thermometer';
  if (typeLower.includes('geofence')) return 'map-marker-alert';
  return 'alert';
};

const getColorForSeverity = (severity) => {
  if (severity === 'critical') return STATUS_COLORS.ERROR;
  if (severity === 'high') return STATUS_COLORS.WARNING;
  if (severity === 'medium') return STATUS_COLORS.INFO;
  return STATUS_COLORS.SUCCESS;
};

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlertsFromStorage = useCallback(async () => {
    try {
      const storedAlerts = await AsyncStorage.getItem('cached_alerts');
      if (storedAlerts) {
        const parsedAlerts = JSON.parse(storedAlerts);
        setAlerts(parsedAlerts);
        console.log('✅ Loaded', parsedAlerts.length, 'alerts from cache');
        return true;
      }
      console.log('No cached alerts found');
      return false;
    } catch (error) {
      console.error('Failed to load alerts from storage:', error);
      return false;
    }
  }, []);

  const loadAlertsFromAPI = useCallback(async () => {
    try {
      // Check network status first (with error handling for Expo Go)
      let isOnline = true;
      try {
        const netInfo = await NetInfo.fetch();
        isOnline = netInfo.isConnected && netInfo.isInternetReachable;
      } catch (netError) {
        console.warn('NetInfo check failed (non-critical):', netError);
        // Assume online if NetInfo fails (Expo Go compatibility)
        isOnline = true;
      }
      
      if (!isOnline) {
        // Offline - load from cache
        console.log('📴 Offline: Loading alerts from cache');
        await loadAlertsFromStorage();
        return;
      }
      
      // Online - fetch from API with timeout protection (10 seconds)
      let data;
      try {
        data = await Promise.race([
          alertsService.getAll(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Alerts API timeout')), 10000)
          )
        ]);
      } catch (apiError) {
        // On timeout or error, try to load from cache
        console.warn('Alerts API failed or timed out, loading from cache:', apiError.message);
        const cached = await loadAlertsFromStorage();
        if (cached) {
          setLoading(false);
          return; // Already loaded from cache
        }
        // If cache also fails, throw to outer catch
        throw apiError;
      }
      
      const alertsArray = Array.isArray(data) ? data : (data.results || []);
      
      // Group alerts by animal + alert type, keeping only the most recent one
      const alertsByAnimalAndType = new Map();
      
      alertsArray.forEach(alert => {
        const animalId = alert.animal_id || alert.animal || 'unknown';
        const alertType = alert.alert_type || alert.type || 'general';
        const key = `${animalId}-${alertType}`;
        
        const alertTimestamp = new Date(alert.detected_at || alert.timestamp || alert.created_at || 0);
        
        // If we haven't seen this animal+type combo, or this alert is newer, keep it
        const existing = alertsByAnimalAndType.get(key);
        if (!existing || alertTimestamp > new Date(existing.detected_at || existing.timestamp || existing.created_at || 0)) {
        const timestamp = alert.detected_at || alert.timestamp || alert.created_at || new Date().toISOString();
        const timeAgo = getTimeAgo(timestamp);
        
          alertsByAnimalAndType.set(key, {
            id: alert.id || `alert-${animalId}-${timestamp}`,
          title: alert.title || 'Wildlife Alert',
            type: alertType,
          priority: alert.severity || 'medium',
          status: alert.status || 'New',
          timestamp: timeAgo,
          active: alert.status !== 'resolved' && alert.status !== 'closed',
            icon: getIconForAlertType(alertType),
          color: getColorForSeverity(alert.severity),
            source: 'api',
            detected_at: timestamp, // Keep original timestamp for sorting
          });
        }
      });
      
      // Convert Map to Array and sort by most recent first
      const transformedAlerts = Array.from(alertsByAnimalAndType.values())
        .sort((a, b) => {
          const timeA = new Date(a.detected_at || 0);
          const timeB = new Date(b.detected_at || 0);
          return timeB - timeA; // Most recent first
        });
      setAlerts(transformedAlerts);
      
      // Cache alerts for offline use
      try {
        await AsyncStorage.setItem('cached_alerts', JSON.stringify(transformedAlerts));
        await AsyncStorage.setItem('cached_alerts_timestamp', new Date().toISOString());
      } catch (cacheError) {
        console.warn('Failed to cache alerts:', cacheError);
      }
    } catch (error) {
      console.error('Failed to load alerts from API:', error);
      // Try to load from storage as fallback
      await loadAlertsFromStorage();
    } finally {
      setLoading(false);
    }
  }, [loadAlertsFromStorage]);

  // Load alerts from API on app start (with offline support)
  useEffect(() => {
    loadAlertsFromAPI();
    // Refresh alerts every 30 seconds (only when online)
    const interval = setInterval(async () => {
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected && netInfo.isInternetReachable) {
          loadAlertsFromAPI();
        }
      } catch (netError) {
        // If NetInfo fails, still try to load (Expo Go compatibility)
        console.warn('NetInfo check failed in interval (non-critical):', netError);
        loadAlertsFromAPI();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAlertsFromAPI]);

  const addAlert = (alertData) => {
    const newAlert = {
      id: Date.now(), // Simple ID generation
      timestamp: 'Just now',
      active: true,
      status: 'New',
      source: 'user_report',
      ...alertData
    };

    setAlerts(prev => [newAlert, ...prev]);
    return newAlert.id;
  };

  const updateAlert = (alertId, updates) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, ...updates } : alert
    ));
  };

  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertsByType = (type) => {
    return alerts.filter(alert => alert.type === type);
  };

  const getActiveAlerts = () => {
    return alerts.filter(alert => alert.active);
  };

  const getResolvedAlerts = () => {
    return alerts.filter(alert => !alert.active);
  };

  const acknowledgeAlert = (alertId) => {
    updateAlert(alertId, { status: 'Acknowledged' });
  };

  const snoozeAlert = (alertId) => {
    updateAlert(alertId, { status: 'Snoozed' });
  };

  const resolveAlert = (alertId) => {
    updateAlert(alertId, { status: 'Resolved', active: false });
  };

  const value = {
    alerts,
    loading,
    loadAlertsFromAPI,
    addAlert,
    updateAlert,
    removeAlert,
    getAlertsByType,
    getActiveAlerts,
    getResolvedAlerts,
    acknowledgeAlert,
    snoozeAlert,
    resolveAlert,
  };

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
};