import React, { createContext, useContext, useState, useEffect } from 'react';
// Temporarily comment out AsyncStorage for web compatibility testing
// import AsyncStorage from '@react-native-async-storage/async-storage';

const AlertsContext = createContext();

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertsProvider');
  }
  return context;
};

export const AlertsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: 'Equipment Malfunction Warning',
      type: 'Equipment',
      priority: 'Critical',
      status: 'New',
      timestamp: '5 mins ago',
      active: true,
      icon: '⚠️',
      color: '#f97316',
      source: 'system'
    },
    {
      id: 2,
      title: 'Unauthorized Entry',
      type: 'Geofence',
      priority: 'Critical',
      status: 'Acknowledged',
      timestamp: '1 day ago',
      active: true,
      icon: '🛡️',
      color: '#ef4444',
      source: 'system'
    },
    {
      id: 3,
      title: 'High Temperature Detected',
      type: 'Temperature',
      priority: 'High',
      status: 'Snoozed',
      timestamp: '25 mins ago',
      active: true,
      icon: '🌡️',
      color: '#10b981',
      source: 'system'
    },
    {
      id: 4,
      title: 'Equipment Malfunction Warning',
      type: 'Equipment',
      priority: 'Medium',
      status: 'Resolved',
      timestamp: '15 days ago',
      active: false,
      icon: '⚠️',
      color: '#f97316',
      source: 'system'
    }
  ]);

  // Load alerts from storage on app start
  useEffect(() => {
    loadAlertsFromStorage();
  }, []);

  const saveAlertsToStorage = React.useCallback(async () => {
    try {
      // Temporarily disabled for web compatibility
      // await AsyncStorage.setItem('wildlife_alerts', JSON.stringify(alerts));
      console.log('Alerts saved (storage disabled for testing):', alerts.length);
    } catch (error) {
      console.error('Failed to save alerts to storage:', error);
    }
  }, [alerts]);

  // Save alerts to storage whenever alerts change
  useEffect(() => {
    saveAlertsToStorage();
  }, [saveAlertsToStorage]);

  const loadAlertsFromStorage = async () => {
    try {
      // Temporarily disabled for web compatibility
      // const storedAlerts = await AsyncStorage.getItem('wildlife_alerts');
      // if (storedAlerts) {
      //   setAlerts(JSON.parse(storedAlerts));
      // }
      console.log('Load from storage disabled for testing');
    } catch (error) {
      console.error('Failed to load alerts from storage:', error);
    }
  };

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