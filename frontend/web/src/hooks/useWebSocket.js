import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '@/services/websocket';

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
    console.log('Received initial data:', data.animals?.length || 0, 'animals');
    if (data.animals && Array.isArray(data.animals)) {
      setAnimals(data.animals);
      setLastUpdate(new Date().toISOString());
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
   * Handle position updates from WebSocket
   */
  const handlePositionUpdate = useCallback((data) => {
    console.log('Received position update:', data.animals?.length || 0, 'animals');
    
    if (data.animals && Array.isArray(data.animals)) {
      setAnimals(prevAnimals => {
        // Create a map of existing animals for quick lookup
        const animalMap = new Map(prevAnimals.map(animal => [animal.id, animal]));

        // Update or add animals from the update
        data.animals.forEach(updatedAnimal => {
          const existing = animalMap.get(updatedAnimal.id);
          animalMap.set(updatedAnimal.id, {
            ...existing,
            ...updatedAnimal,
            // Calculate path color
            pathColor: getPathColor(updatedAnimal),
          });
        });

        return Array.from(animalMap.values());
      });

      // Track movement paths
      setAnimalPaths(prevPaths => {
        const newPaths = { ...prevPaths };
        
        data.animals.forEach(animal => {
          const position = animal.current_position;
          if (position && position.lat && position.lon) {
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
   * Handle alert messages from WebSocket
   */
  const handleAlert = useCallback((data) => {
    console.log('Received alert:', data.message);
    
    // Determine alert severity and type
    const alertType = data.alert_type || 'general';
    const severity = data.severity || 'medium';
    
    const alert = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: alertType,
      severity: severity,
      animalId: data.animal_id,
      animalName: data.animal_name,
      message: data.message,
      location: data.location,
      // Color code by severity
      color: severity === 'critical' || severity === 'high' ? '#DC2626' : 
             severity === 'medium' ? '#F59E0B' : '#10B981',
      icon: alertType === 'poaching' ? '🚨' :
            alertType === 'risk_zone' ? '⚠️' :
            alertType === 'corridor_exit' ? '🚪' :
            alertType === 'danger_zone' ? '☠️' : '📍',
    };

    setAlerts(prevAlerts => [alert, ...prevAlerts].slice(0, 50)); // Keep last 50 alerts

    // Update animal risk level if this is a danger alert
    if (severity === 'critical' || severity === 'high') {
      setAnimals(prevAnimals => 
        prevAnimals.map(animal => 
          animal.id === data.animal_id 
            ? { ...animal, risk_level: severity, pathColor: '#DC2626' }
            : animal
        )
      );
    }

    // Call custom callback if provided
    if (onAlert) {
      onAlert(alert);
    }
  }, [onAlert]);

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
    setError('WebSocket connection error');
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

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      unsubscribers.current.forEach(unsub => unsub());
      if (autoConnect) {
        disconnect();
      }
    };
  }, [
    autoConnect,
    connect,
    disconnect,
    handleConnection,
    handleInitialData,
    handlePositionUpdate,
    handleAlert,
    handleStateChange,
    handleError,
  ]);

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

