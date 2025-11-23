import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '@services/websocket';

/**
 * Custom hook for managing WebSocket connection and real-time animal tracking
 * 
 * Usage:
 * const {
 *   animals,
 *   isConnected,
 *   connectionStatus,
 *   alerts,
 *   lastUpdate
 * } = useWebSocket({ autoConnect: true });
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: true)
 * @param {function} options.onAlert - Callback for alert messages
 * @param {function} options.onPositionUpdate - Callback for position updates
 * @returns {Object} WebSocket state and controls
 */
export const useWebSocket = (options = {}) => {
  const {
    autoConnect = true,
    onAlert = null,
    onPositionUpdate = null,
  } = options;

  // State
  const [animals, setAnimals] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [alerts, setAlerts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [animalPaths, setAnimalPaths] = useState({}); // Track movement paths for each animal

  // Refs for cleanup
  const unsubscribers = useRef([]);

  /**
   * Handle initial data from WebSocket
   */
  const handleInitialData = useCallback((data) => {
    console.log('📥 Mobile WebSocket initial data received:', data.animals?.length || 0, 'animals');
    if (data.animals && Array.isArray(data.animals)) {
      console.log('✅ Mobile: Setting initial animals state:', data.animals.length);
      // Force state update by creating a new array reference
      setAnimals([...data.animals]);
      setLastUpdate(new Date().toISOString());
      console.log('🔄 Mobile: State updated, should trigger re-render');
    }
  }, []);

  /**
   * Determine path color based on animal state
   */
  const getPathColor = useCallback((animal) => {
    const activity = animal.movement?.activity_type || animal.activity_type || 'unknown';
    const riskLevel = animal.risk_level || 'low';
    const status = animal.status || 'active';

    // Red for danger/risk zones
    if (riskLevel === 'critical' || riskLevel === 'high') {
      return '#DC2626'; // Crimson red
    }

    // Yellow for resting/inactive
    if (activity === 'resting' || status === 'inactive' || activity === 'feeding') {
      return '#F59E0B'; // Amber yellow
    }

    // Green for active/moving
    if (activity === 'moving' || status === 'active') {
      return '#10B981'; // Emerald green
    }

    return '#6B7280'; // Gray for unknown
  }, []);

  /**
   * Handle position updates from WebSocket (with activity-based movement)
   */
  const handlePositionUpdate = useCallback((data) => {
    console.log('🔄 Mobile WebSocket position update received:', data.animals?.length || 0, 'animals');
    
    if (data.animals && Array.isArray(data.animals)) {
      setAnimals(prevAnimals => {
        console.log('📊 Mobile: Updating animals state - previous:', prevAnimals.length, 'new:', data.animals.length);
        // Create a map of existing animals for quick lookup
        const animalMap = new Map(prevAnimals.map(animal => [animal.id, animal]));

        // Update or add animals from the update
        data.animals.forEach(updatedAnimal => {
          const existing = animalMap.get(updatedAnimal.id);
          const activityType = updatedAnimal.movement?.activity_type || 'unknown';
          const speed = updatedAnimal.movement?.speed_kmh || 0;
          const conflictRisk = updatedAnimal.conflict_risk || {};
          
          // Determine if animal should animate based on activity_type
          const shouldAnimate = activityType === 'moving' && speed > 2;
          const shouldWobble = activityType === 'feeding';
          const isResting = activityType === 'resting';
          
          animalMap.set(updatedAnimal.id, {
            ...existing,
            ...updatedAnimal,
            // Calculate path color
            pathColor: getPathColor(updatedAnimal),
            // Activity-based movement flags
            activityType: activityType,
            shouldAnimate: shouldAnimate,
            shouldWobble: shouldWobble,
            isResting: isResting,
            // Conflict risk data
            conflict_risk: conflictRisk,
            // Update risk level based on conflict_risk
            risk_level: conflictRisk.risk_level || updatedAnimal.risk_level || 'low',
          });
        });

        const newAnimals = Array.from(animalMap.values());
        console.log('✅ Mobile: Animals state updated, new count:', newAnimals.length);
        console.log('🔄 Mobile: State change should trigger UI re-render');
        // Force new array reference to ensure React detects the change
        return newAnimals;
      });

      // Track movement paths (only for moving/feeding animals, not resting)
      setAnimalPaths(prevPaths => {
        const newPaths = { ...prevPaths };
        
        data.animals.forEach(animal => {
          const position = animal.current_position;
          const activityType = animal.movement?.activity_type || 'unknown';
          
          // Only track paths for moving/feeding animals
          if (position && position.lat && position.lon && activityType !== 'resting') {
            if (!newPaths[animal.id]) {
              newPaths[animal.id] = [];
            }
            
            // Add new position to path (keep last 50 positions)
            newPaths[animal.id] = [
              ...newPaths[animal.id],
              {
                lat: position.lat,
                lon: position.lon,
                timestamp: animal.last_updated || new Date().toISOString(),
                color: getPathColor(animal),
                activity: activityType,
              }
            ].slice(-50); // Keep last 50 positions
          }
        });

        return newPaths;
      });

      setLastUpdate(new Date().toISOString());

      // Call custom callback if provided
      if (onPositionUpdate) {
        onPositionUpdate(data);
      }
    }
  }, [onPositionUpdate, getPathColor]);

  /**
   * Get alert icon based on alert type
   */
  const getAlertIcon = useCallback((alertType) => {
    const icons = {
      'high_risk_zone': '⚠️',
      'poaching_risk': '🚨',
      'corridor_exit': '📍',
      'rapid_movement': '⚡',
      'low_battery': '🔋',
      'weak_signal': '📡',
      'stationary_too_long': '⏸️',
      'unusual_behavior': '❓',
    };
    return icons[alertType] || '⚠️';
  }, []);

  /**
   * Get severity color
   */
  const getSeverityColor = useCallback((severity) => {
    const colors = {
      'critical': '#DC2626',
      'high': '#EA580C',
      'medium': '#F59E0B',
      'low': '#3B82F6',
    };
    return colors[severity] || '#6B7280';
  }, []);

  /**
   * Handle alert messages from WebSocket (new format)
   */
  const handleAlert = useCallback((data) => {
    console.log('Received alert:', data);
    
    // Handle new alert structure: { type: 'alert', alert: { ... } }
    const alertData = data.alert || data;
    
    const alertType = alertData.alert_type || alertData.type || 'general';
    const severity = alertData.severity || 'medium';
    const animal = alertData.animal || {};
    const position = alertData.position || {};
    const metadata = alertData.metadata || {};
    
    // Generate a stable ID for the alert
    const alertId = alertData.id || 
      (alertData.animal_id && alertData.timestamp 
        ? `${alertData.animal_id}-${alertData.timestamp}` 
        : `alert-${Date.now()}-${Math.random()}`);
    
    const alert = {
      id: alertId,
      timestamp: alertData.timestamp || new Date().toISOString(),
      type: alertType,
      severity: severity,
      status: alertData.status || 'active',
      title: alertData.title || `${animal.name || 'Animal'} Alert`,
      message: alertData.message || 'Alert received',
      animalId: animal.id || alertData.animal_id,
      animalName: animal.name || alertData.animal_name,
      position: position,
      metadata: metadata,
      // Color code by severity
      color: getSeverityColor(severity),
      icon: getAlertIcon(alertType),
    };

    // Only add alert if it doesn't already exist (deduplicate by ID)
    setAlerts(prevAlerts => {
      // Check if alert with this ID already exists
      const existingIndex = prevAlerts.findIndex(a => a.id === alert.id);
      
      if (existingIndex >= 0) {
        // Alert already exists, update it instead of adding duplicate
        const updated = [...prevAlerts];
        updated[existingIndex] = { ...updated[existingIndex], ...alert };
        return updated.slice(0, 50);
      }
      
      // New alert, add it to the beginning
      return [alert, ...prevAlerts].slice(0, 50);
    });

    // Update animal risk level and conflict status if this is a danger alert
    if (severity === 'critical' || severity === 'high') {
      setAnimals(prevAnimals => 
        prevAnimals.map(animal => 
          animal.id === alert.animalId 
            ? { 
                ...animal, 
                risk_level: severity, 
                pathColor: '#DC2626',
                conflict_risk: {
                  risk_level: severity,
                  in_conflict_zone: true,
                  zone_name: metadata.zone_name,
                  zone_type: metadata.zone_type,
                }
              }
            : animal
        )
      );
    }

    // Call custom callback if provided
    if (onAlert) {
      onAlert(alert);
    }
  }, [onAlert, getAlertIcon, getSeverityColor]);

  /**
   * Handle state change messages from WebSocket
   */
  const handleStateChange = useCallback((data) => {
    console.log('Received state change:', data);
    // You can handle backend state changes here if needed
  }, []);

  /**
   * Handle connection status changes
   */
  const handleConnection = useCallback((data) => {
    const { status } = data;
    setConnectionStatus(status);
    setIsConnected(status === 'connected');

    if (status === 'connected') {
      setError(null);
    } else if (status === 'failed') {
      setError(data.message || 'Connection failed');
    }
  }, []);

  /**
   * Handle WebSocket errors
   */
  const handleError = useCallback((data) => {
    console.error('WebSocket error:', data);
    // Don't set error state for transient errors to prevent UI crashes
    // Only set error for critical failures
    if (data && data.error && typeof data.error === 'string' && data.error.includes('fatal')) {
    setError('WebSocket connection error');
    }
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    websocketService.shouldReconnect = true;
    websocketService.connect();
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  /**
   * Subscribe to specific animal
   */
  const subscribeToAnimal = useCallback((animalId) => {
    websocketService.subscribeToAnimal(animalId);
  }, []);

  /**
   * Unsubscribe from specific animal
   */
  const unsubscribeFromAnimal = useCallback((animalId) => {
    websocketService.unsubscribeFromAnimal(animalId);
  }, []);

  /**
   * Clear alerts
   */
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  /**
   * Setup WebSocket listeners
   * Using refs to avoid dependency issues that cause re-renders
   */
  useEffect(() => {
    // Subscribe to WebSocket events
    const unsubConnection = websocketService.on('connection', handleConnection);
    const unsubInitialData = websocketService.on('initial_data', handleInitialData);
    const unsubPositionUpdate = websocketService.on('position_update', handlePositionUpdate);
    const unsubAlert = websocketService.on('alert', handleAlert);
    const unsubStateChange = websocketService.on('state_change', handleStateChange);
    const unsubError = websocketService.on('error', handleError);

    // Store unsubscribers
    unsubscribers.current = [
      unsubConnection,
      unsubInitialData,
      unsubPositionUpdate,
      unsubAlert,
      unsubStateChange,
      unsubError,
    ];

    // Auto-connect if enabled (with delay to prevent race conditions)
    let connectTimer = null;
    if (autoConnect) {
      // Small delay to ensure component is fully mounted and token is available
      connectTimer = setTimeout(() => {
        try {
          connect();
        } catch (error) {
          console.error('Failed to connect WebSocket:', error);
          setError('Failed to connect to real-time updates');
        }
      }, 1000); // 1 second delay to ensure auth token is stored
    }
    
    // Cleanup on unmount
    return () => {
      if (connectTimer) {
        clearTimeout(connectTimer);
      }
      unsubscribers.current.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.warn('Error unsubscribing from WebSocket:', error);
        }
      });
      if (autoConnect) {
        try {
          disconnect();
        } catch (error) {
          console.warn('Error disconnecting WebSocket:', error);
        }
      }
    };

    // Cleanup on unmount
    return () => {
      unsubscribers.current.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.warn('Error unsubscribing from WebSocket:', error);
        }
      });
      if (autoConnect) {
        try {
        disconnect();
        } catch (error) {
          console.warn('Error disconnecting WebSocket:', error);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]); // Only depend on autoConnect to prevent unnecessary re-renders

  /**
   * Clear paths for all animals
   */
  const clearPaths = useCallback(() => {
    setAnimalPaths({});
  }, []);

  /**
   * Clear paths for specific animal
   */
  const clearAnimalPath = useCallback((animalId) => {
    setAnimalPaths(prevPaths => {
      const newPaths = { ...prevPaths };
      delete newPaths[animalId];
      return newPaths;
    });
  }, []);

  return {
    // Data
    animals,
    alerts,
    lastUpdate,
    error,
    animalPaths, // Movement paths for visualization

    // Connection state
    isConnected,
    connectionStatus,

    // Controls
    connect,
    disconnect,
    subscribeToAnimal,
    unsubscribeFromAnimal,
    clearAlerts,
    clearPaths,
    clearAnimalPath,
  };
};

export default useWebSocket;

