import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Shield } from '@/components/shared/Icons';
import Sidebar from '@/components/shared/Sidebar';
import MapComponent from '@/components/shared/MapComponent';
import { COLORS } from '@/constants/Colors';
import { auth, predictions as predictionsService } from '@/services';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useData } from '@/contexts/DataContext';
import { handleNewAlert } from '@/utils/alertNotifications';

const Dashboard = () => {
  const navigate = useNavigate();
  const [alertMessage, setAlertMessage] = useState('');
  const notifiedAlertIdsRef = useRef(new Set()); // Track which alerts have been notified
  const previousAlertsRef = useRef([]); // Track previous alerts to detect new ones

  // WebSocket integration for real-time animal tracking
  const { 
    animals: wsAnimals, 
    isConnected,
    alerts: wsAlerts
  } = useWebSocket({
    autoConnect: false, // CHANGED: Don't auto-connect - connection managed centrally
    onAlert: (alert) => {
      // Show toast notification for dashboard alerts
      setAlertMessage(`${alert.icon} ${alert.message}`);
      setTimeout(() => setAlertMessage(''), 5000);
      
      // Play sound and show notification for new WebSocket alerts
      const alertId = alert.id || `ws-${alert.timestamp || Date.now()}`;
      if (!notifiedAlertIdsRef.current.has(alertId)) {
        console.log('🔔 Dashboard: New WebSocket alert detected:', alertId);
        const alertForNotification = {
          id: alertId,
          title: alert.title || alert.type || 'Wildlife Alert',
          message: alert.message || alert.description || '',
          severity: alert.severity || 'medium',
          type: alert.alert_type || alert.type || 'general',
          animalName: alert.animalName || 'Unknown Animal',
          animalSpecies: alert.animalSpecies || alert.species || 'Unknown',
          animalId: alert.animalId || alert.animal,
        };
        handleNewAlert(alertForNotification).catch(err => {
          console.warn('Failed to show alert notification:', err);
        });
        notifiedAlertIdsRef.current.add(alertId);
      }
    }
  });

  // Transform animals for map markers
  const [mapMarkers, setMapMarkers] = useState([]);
  
  // Use DataContext for all data (prevents duplicate API calls)
  const { 
    corridors, 
    riskZones, 
    rangers, 
    alerts: apiAlerts 
  } = useData();
  
  // Local state for computed data
  const [predictions, setPredictions] = useState({});
  const [environmentData, setEnvironmentData] = useState({});
  const [alertMarkers, setAlertMarkers] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]); // Store all alerts for display
  // Alert statistics - counts by status and severity (updated from database alerts including mobile-created ones)
  const [alertStats, setAlertStats] = useState({ active: 0, critical: 0, high: 0, medium: 0, total: 0 });
  
  // Get rangers on duty with their names
  const rangersOnDuty = React.useMemo(() => {
    if (!rangers || !Array.isArray(rangers)) return [];
    return rangers.filter(r => {
      const status = r.status || r.current_status || '';
      return status === 'active' || status === 'on_duty' || status === 'patrolling' || 
             (typeof status === 'string' && status.toLowerCase() === 'on_duty');
    }).map(r => ({
      id: r.id || r.ranger_id,
      name: r.name || r.username || r.user_name || 'Ranger',
      team: r.team_name || r.team || 'Unassigned',
      status: r.status || r.current_status || 'on_duty'
    }));
  }, [rangers]);

  const handleLogout = async () => {
    try {
      // Use auth service to properly logout (clears all tokens and notifies backend)
      await auth.logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, still clear local storage and navigate
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      navigate('/auth', { replace: true });
    }
  };


  // Transform WebSocket animals to map markers (with full data like main map)
  // This effect runs whenever wsAnimals changes, ensuring real-time updates
  useEffect(() => {
    // Process WebSocket animals if available (even if empty array - to clear state)
    if (wsAnimals && Array.isArray(wsAnimals)) {
      // Only update if WebSocket is connected and has data, or if explicitly empty
      if (wsAnimals.length === 0 && !isConnected) {
        console.log('⏸️ Dashboard: WebSocket empty and not connected, keeping existing markers');
        return;
      }
      
      console.log('🔄 Dashboard: Processing WebSocket animal data:', wsAnimals.length, 'animals');
      const markers = wsAnimals.map(animal => {
        const position = animal.current_position;
        const activity = animal.movement?.activity_type || 'unknown';
        const riskLevel = animal.risk_level || 'low';
        
        // Determine marker color based on state
        let color = '#10B981'; // Green for active/safe
        let type = animal.species?.toLowerCase().includes('elephant') ? 'elephant' : 
                   animal.species?.toLowerCase().includes('wildebeest') ? 'wildebeest' : 'wildlife';
        
        if (riskLevel === 'critical' || riskLevel === 'high') {
          color = '#DC2626'; // Red for danger
        } else if (activity === 'resting' || activity === 'feeding') {
          color = '#F59E0B'; // Yellow for resting
        }
        
        // Check for recent alerts
        const hasAlert = wsAlerts.some(alert => 
          alert.animalId === animal.id && 
          (Date.now() - new Date(alert.timestamp).getTime()) < 300000
        );
        
        if (hasAlert) {
          color = '#DC2626';
        }
        
        // Calculate predicted position if available
        const predictedPosition = animal.predicted_position || 
          (animal.movement?.predicted_lat && animal.movement?.predicted_lon ? 
            [animal.movement.predicted_lat, animal.movement.predicted_lon] : 
            [position?.lat || 0, position?.lon || 0]);
        
        return {
          id: animal.id,
          position: [position?.lat || 0, position?.lon || 0],
          predictedPosition: predictedPosition,
          type: type,
          title: animal.name || animal.species,
          description: `${activity} - ${animal.movement?.speed_kmh?.toFixed(1) || 0} km/h`,
          color: color,
          activityType: activity,
          speed: animal.movement?.speed_kmh || 0,
          behaviorState: animal.behavior_state || activity,
          risk_level: riskLevel
        };
      }).filter(marker => marker.position[0] !== 0 && marker.position[1] !== 0);
      
      setMapMarkers(markers);
      console.log('✅ Dashboard: Updated map markers:', markers.length);
    } else if (wsAnimals && wsAnimals.length === 0 && isConnected) {
      // WebSocket connected but no animals - clear markers
      console.log('⚠️ Dashboard: WebSocket connected but no animals received');
      setMapMarkers([]);
    }
  }, [wsAnimals, wsAlerts, isConnected]);

  // REMOVED: fetchCorridors, fetchRiskZones, fetchRangers, fetchAnimals
  // These are now handled by DataContext to prevent duplicate API requests
  // DataContext provides: corridors, riskZones, rangers, alerts via useData() hook

  const fetchPredictions = useCallback(async () => {
    try {
      // Create predictions from WebSocket animals (same as main map)
      if (wsAnimals && wsAnimals.length > 0) {
        const predictionMap = {};
        wsAnimals.forEach(animal => {
          const position = animal.current_position;
          const predictedPosition = animal.predicted_position || 
            (animal.movement?.predicted_lat && animal.movement?.predicted_lon ? 
              [animal.movement.predicted_lat, animal.movement.predicted_lon] : null);
          
          if (predictedPosition && position) {
            predictionMap[animal.id] = {
              movementPath: [[position.lat, position.lon], predictedPosition],
              combinedPath: [[position.lat, position.lon], predictedPosition],
              animal_id: animal.id,
              lstmPredictions: [],
              behavioralState: animal.behavior_state || animal.movement?.activity_type || 'unknown'
            };
          }
        });
        setPredictions(predictionMap);
        console.log('Dashboard: Generated predictions for', Object.keys(predictionMap).length, 'animals');
      }
    } catch (error) {
      console.warn('Dashboard: Predictions unavailable:', error.message);
      setPredictions({});
    }
  }, [wsAnimals]);

  const fetchEnvironmentData = useCallback(async () => {
    try {
      const centerLat = -2.0;
      const centerLon = 35.5;
      const data = await predictionsService.getXGBoostEnvironment(
        centerLat,
        centerLon,
        'elephant',
        50000
      );
      
      if (data) {
        if (data.available) {
          const latKey = data.coordinates?.lat || centerLat;
          setEnvironmentData({
            [latKey]: {
              position: [data.coordinates?.lat || centerLat, data.coordinates?.lon || centerLon],
              intensity: data.habitat_score || 0.5,
              type: 'habitat',
              suitability: data.suitability,
              score: data.habitat_score,
              status: 'success',
              model_info: data.model_info
            }
          });
          console.log('Dashboard: Environment data loaded');
        } else {
          const latKey = data.coordinates?.lat || centerLat;
          setEnvironmentData({
            [latKey]: {
              position: [data.coordinates?.lat || centerLat, data.coordinates?.lon || centerLon],
              intensity: data.habitat_score || 0.5,
              type: 'habitat',
              suitability: 'unknown',
              score: data.habitat_score || 0.5,
              status: 'fallback',
              message: data.message
            }
          });
        }
      }
    } catch (error) {
      console.warn('Dashboard: Environment data unavailable:', error.message);
      setEnvironmentData({});
    }
  }, []);

  // Process alerts from DataContext and WebSocket (no duplicate API calls)
  const processAlerts = useCallback(() => {
    try {
      // Use alerts from DataContext (already fetched)
      const alertsData = apiAlerts || [];
      
      // Filter out alerts that just repeat information already visible on map
      // Only keep alerts with unique/new actionable information (not just animal location)
      const uniqueAlertsData = alertsData.filter(alert => {
        // Skip alerts that are just "animal at location" if that animal is already on the map
        const alertType = (alert.alert_type || alert.type || '').toLowerCase();
        const isLocationOnly = alertType.includes('location') || alertType.includes('position');
        const hasActionableInfo = alert.message || alert.description || 
                                  alertType.includes('risk') || 
                                  alertType.includes('danger') ||
                                  alertType.includes('breach') ||
                                  alertType.includes('emergency') ||
                                  alertType.includes('poaching') ||
                                  alertType.includes('conflict') ||
                                  alertType.includes('battery') ||
                                  alertType.includes('signal') ||
                                  alertType.includes('exit') ||
                                  alertType.includes('entry');
        
        // Keep alerts that have actionable information, not just location updates
        return hasActionableInfo || !isLocationOnly;
      });
      
      // Combine with WebSocket alerts (handle new format) - STRICT deduplication
      const allAlerts = Array.isArray(uniqueAlertsData) ? uniqueAlertsData : [];
      const alertIdSet = new Set(allAlerts.map(a => a.id).filter(Boolean));
      
      if (wsAlerts && wsAlerts.length > 0) {
        wsAlerts.forEach(wsAlert => {
          // Only add if it has actionable information (not just location)
          const wsAlertType = (wsAlert.type || wsAlert.alert_type || '').toLowerCase();
          const hasActionableInfo = wsAlert.message || wsAlert.description ||
                                   wsAlertType.includes('risk') ||
                                   wsAlertType.includes('danger') ||
                                   wsAlertType.includes('breach') ||
                                   wsAlertType.includes('emergency') ||
                                   wsAlertType.includes('poaching') ||
                                   wsAlertType.includes('conflict') ||
                                   wsAlertType.includes('battery') ||
                                   wsAlertType.includes('signal') ||
                                   wsAlertType.includes('exit') ||
                                   wsAlertType.includes('entry');
          
          if (!hasActionableInfo) return; // Skip location-only alerts
          
          // STRICT check: only add if ID doesn't exist
          const wsAlertId = wsAlert.id || `ws-${wsAlert.timestamp || Date.now()}`;
          if (!alertIdSet.has(wsAlertId)) {
            alertIdSet.add(wsAlertId);
            // Convert WebSocket alert to API format
            allAlerts.push({
              id: wsAlertId,
              alert_type: wsAlert.type || wsAlert.alert_type,
              severity: wsAlert.severity || 'medium',
              title: wsAlert.title || 'Wildlife Alert',
              message: wsAlert.message || wsAlert.description,
              latitude: wsAlert.latitude || (wsAlert.coordinates && wsAlert.coordinates[0]),
              longitude: wsAlert.longitude || (wsAlert.coordinates && wsAlert.coordinates[1]),
              animal: wsAlert.animalId,
              animal_id: wsAlert.animalId,
              animal_name: wsAlert.animalName,
              animal_species: wsAlert.animalSpecies,
              conflict_zone_name: wsAlert.conflictZoneName,
              status: wsAlert.status || 'active',
              detected_at: wsAlert.timestamp || wsAlert.detected_at || new Date().toISOString(),
              metadata: wsAlert.metadata || {}
            });
          }
        });
      }
      
      // STRICT deduplication: Use ID as primary key, position+timestamp as fallback
      const alertDedupMap = new Map();
      const positionTimeSet = new Set();
      
      allAlerts.forEach(alert => {
        const alertId = alert.id;
        if (alertId && !alertDedupMap.has(alertId)) {
          alertDedupMap.set(alertId, alert);
        } else if (!alertId && alert.latitude && alert.longitude) {
          // Fallback: use position + timestamp for uniqueness
          const posTimeKey = `${alert.latitude.toFixed(6)}-${alert.longitude.toFixed(6)}-${alert.timestamp || alert.created_at || alert.detected_at || Date.now()}`;
          if (!positionTimeSet.has(posTimeKey)) {
            positionTimeSet.add(posTimeKey);
            alertDedupMap.set(posTimeKey, { ...alert, id: posTimeKey });
          }
        }
      });
      const uniqueAlerts = Array.from(alertDedupMap.values());
      
      const markers = uniqueAlerts
        .filter(alert => {
          // New format: latitude/longitude fields
          const lat = alert.latitude;
          const lon = alert.longitude;
          // Fallback to old format
          const coords = alert.coordinates || [lat, lon] || [0, 0];
          const finalLat = lat || (Array.isArray(coords) ? coords[0] : coords.lat || 0);
          const finalLon = lon || (Array.isArray(coords) ? coords[1] : coords.lon || 0);
          return finalLat !== 0 && finalLon !== 0 && 
                 finalLat >= -5 && finalLat <= 1 && // Kenya/Tanzania bounds
                 finalLon >= 33 && finalLon <= 42;
        })
        .map(alert => {
          // Extract coordinates from new format
          const lat = alert.latitude;
          const lon = alert.longitude;
          const coords = lat && lon ? [lat, lon] : (alert.coordinates || [0, 0]);
          const finalCoords = Array.isArray(coords) ? coords : [coords.lat || coords[0] || 0, coords.lon || coords[1] || 0];
          const finalLat = finalCoords[0];
          const finalLon = finalCoords[1];
          
          const severity = alert.severity || alert.alert_type || 'medium';
          
          // Color based on severity (new color scheme)
          let color = '#F59E0B'; // Orange for medium
          if (severity === 'critical') {
            color = '#DC2626'; // Red for critical
          } else if (severity === 'high') {
            color = '#EA580C'; // Orange-red for high
          } else if (severity === 'low') {
            color = '#3B82F6'; // Blue for low
          }
          
          // Determine alert title from alert_type if title is missing
          let alertTitle = alert.title || alert.alert_type || 'Alert';
          if (alert.alert_type && !alert.title) {
            // Format alert_type for display (e.g., "emergency" -> "Emergency Alert")
            alertTitle = alert.alert_type
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
            if (!alertTitle.toLowerCase().includes('alert')) {
              alertTitle += ' Alert';
            }
          }
          
          // Include message in description if available
          const alertDescription = alert.message || alert.description || '';
          
          // Use original alert ID if available, otherwise create unique ID
          const alertId = alert.id || `alert-${finalLat.toFixed(6)}-${finalLon.toFixed(6)}-${alert.timestamp || alert.created_at || alert.detected_at || Date.now()}`;
          
          return {
            id: alertId,
            position: finalCoords,
            type: 'alert',
            title: alertTitle,
            description: alertDescription,
            message: alertDescription,
            color: color,
            severity: severity,
            alert_type: alert.alert_type,
            animalId: alert.animal || alert.animal_id,
            animalName: alert.animal_name,
            conflictZoneName: alert.conflict_zone_name,
            timestamp: alert.detected_at || alert.timestamp || alert.created_at,
            status: alert.status || 'active'
          };
        });
      
      // Final deduplication pass before setting state - ensure NO duplicates
      const finalDedupMap = new Map();
      markers.forEach(marker => {
        const markerId = marker.id;
        if (!finalDedupMap.has(markerId)) {
          finalDedupMap.set(markerId, marker);
        }
      });
      
      setAlertMarkers(Array.from(finalDedupMap.values()));
      setAllAlerts(uniqueAlerts); // Store all alerts for display in Security Operations
      
      // Detect new alerts and play sounds
      const previousAlertIds = new Set(previousAlertsRef.current.map(a => a.id || a.alert_id).filter(Boolean));
      const newAlerts = uniqueAlerts.filter(alert => {
        const alertId = alert.id || alert.alert_id;
        return alertId && !previousAlertIds.has(alertId) && !notifiedAlertIdsRef.current.has(alertId);
      });
      
      // Play sound and show notification for new alerts
      newAlerts.forEach(alert => {
        const alertId = alert.id || alert.alert_id;
        if (alertId && !notifiedAlertIdsRef.current.has(alertId)) {
          console.log('🔔 Dashboard: New alert detected:', alertId);
          const alertForNotification = {
            id: alertId,
            title: alert.title || alert.alert_type || 'Wildlife Alert',
            message: alert.message || alert.description || '',
            severity: alert.severity || 'medium',
            type: alert.alert_type || alert.type || 'general',
            animalName: alert.animal_name || 'Unknown Animal',
            animalSpecies: alert.animal_species || alert.species || 'Unknown',
            animalId: alert.animal_id || alert.animal,
          };
          handleNewAlert(alertForNotification).catch(err => {
            console.warn('Failed to show alert notification:', err);
          });
          notifiedAlertIdsRef.current.add(alertId);
        }
      });
      
      // Update previous alerts reference
      previousAlertsRef.current = uniqueAlerts;
      
      // Calculate alert statistics from ALL unique alerts (including mobile-created ones and WebSocket)
      // Use uniqueAlerts which includes both API and WebSocket alerts after deduplication
      const activeAlerts = uniqueAlerts.filter(a => {
        const status = String(a.status || '').toLowerCase();
        return status === 'active' || !status || status === 'new' || status === '';
      });
      
      const criticalAlerts = uniqueAlerts.filter(a => {
        const severity = String(a.severity || '').toLowerCase();
        const alertType = String(a.alert_type || a.type || '').toLowerCase();
        return severity === 'critical' || alertType === 'critical' || severity === 'emergency' || alertType === 'emergency';
      });
      
      const highAlerts = uniqueAlerts.filter(a => {
        const severity = String(a.severity || '').toLowerCase();
        const alertType = String(a.alert_type || a.type || '').toLowerCase();
        const isCritical = severity === 'critical' || alertType === 'critical' || severity === 'emergency' || alertType === 'emergency';
        // High: severity/type is high, but not critical/emergency
        return (severity === 'high' || alertType === 'high') && !isCritical;
      });
      
      // Medium: everything that's not critical, high, or emergency
      const mediumAlerts = uniqueAlerts.filter(a => {
        const severity = String(a.severity || '').toLowerCase();
        const alertType = String(a.alert_type || a.type || '').toLowerCase();
        const isCritical = severity === 'critical' || alertType === 'critical' || severity === 'emergency' || alertType === 'emergency';
        const isHigh = (severity === 'high' || alertType === 'high') && !isCritical;
        return !isCritical && !isHigh;
      });
      
      const stats = {
        active: activeAlerts.length,
        critical: criticalAlerts.length,
        high: highAlerts.length,
        medium: mediumAlerts.length,
        total: uniqueAlerts.length // Use uniqueAlerts for total count
      };
      
      console.log('📊 Dashboard: Alert stats calculated (filtered for unique info):', {
        totalAlerts: uniqueAlerts.length,
        apiAlerts: alertsData.length,
        filteredAlerts: uniqueAlertsData.length,
        wsAlerts: wsAlerts?.length || 0,
        stats,
        breakdown: {
          active: activeAlerts.length,
          critical: criticalAlerts.length,
          high: highAlerts.length,
          medium: mediumAlerts.length
        }
      });
      setAlertStats(stats);
    } catch (error) {
      setAlertMarkers([]);
      setAllAlerts([]);
      // Reset stats to 0 if fetch fails
      setAlertStats({ active: 0, critical: 0, high: 0, medium: 0, total: 0 });
    }
  }, [wsAlerts, apiAlerts]); // Depend on both WebSocket and API alerts

  // Update predictions when animals change (lazy load - don't block)
  useEffect(() => {
    // Only fetch predictions if we have animals and WebSocket is connected
    if (wsAnimals && wsAnimals.length > 0 && isConnected) {
      // Delay predictions to not block initial load
      const timer = setTimeout(() => {
        fetchPredictions().catch(err => console.warn('Failed predictions:', err));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [wsAnimals, isConnected, fetchPredictions]);

  // Process alerts when DataContext alerts or WebSocket alerts change
  useEffect(() => {
    processAlerts();
  }, [processAlerts]);

  // REMOVED: All fetch functions and useEffect hooks that made duplicate API calls
  // DataContext handles all data fetching automatically
  
  // Only load predictions and environment data (not in DataContext)
  useEffect(() => {
    let mounted = true;
    let timeoutIds = [];
    
    // Load heavy data after 2 seconds (predictions, environment)
    const timeout = setTimeout(() => {
      if (mounted) {
        fetchPredictions().catch(err => console.warn('Failed predictions:', err));
        fetchEnvironmentData().catch(err => console.warn('Failed environment:', err));
      }
    }, 2000);
    timeoutIds.push(timeout);
    
    return () => {
      mounted = false;
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [fetchPredictions, fetchEnvironmentData]);

  // Transform alerts to incidents format for Security Operations
  const incidents = React.useMemo(() => {
    return allAlerts
      .filter(alert => alert.status === 'active' || !alert.status)
      .sort((a, b) => {
        const timeA = new Date(a.detected_at || a.timestamp || a.created_at || 0).getTime();
        const timeB = new Date(b.detected_at || b.timestamp || b.created_at || 0).getTime();
        return timeB - timeA; // Most recent first
      })
      .slice(0, 3) // Show top 3 most recent
      .map(alert => {
      const severity = alert.severity || alert.alert_type || 'medium';
      const detectedAt = alert.detected_at || alert.timestamp || alert.created_at;
      const timeAgo = detectedAt ? (() => {
        const diff = Date.now() - new Date(detectedAt).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ago`;
        return `${minutes}m ago`;
      })() : 'Just now';
      
      return {
        id: alert.id,
        type: alert.alert_type || alert.title || 'Wildlife Alert',
        status: alert.status === 'resolved' ? 'Resolved' : alert.status === 'acknowledged' ? 'Responding' : 'Active',
        time: timeAgo,
        description: alert.message || alert.description || `${alert.animal_name || 'Animal'} alert in ${alert.conflict_zone_name || 'wildlife area'}`,
        location: alert.conflict_zone_name || (alert.latitude && alert.longitude ? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}` : 'Unknown'),
        rangers: 0, // Will be calculated from rangers assigned to this alert
        severity: severity,
        alert: alert // Store full alert object for reference
      };
      });
  }, [allAlerts]);

  // Generate teams from rangers data
  const patrols = React.useMemo(() => {
    if (!rangers || rangers.length === 0) return [];
    
    // Group rangers by team
    const teamsMap = new Map();
    rangers.forEach(ranger => {
      const teamName = ranger.team || ranger.team_name || 'Unassigned';
      if (!teamsMap.has(teamName)) {
        teamsMap.set(teamName, {
          id: teamName,
          name: teamName,
          rangers: [],
          location: '',
          nextCheck: 'Active',
          inactive: false
        });
      }
      teamsMap.get(teamName).rangers.push(ranger);
    });
    
    // Convert to array and calculate team stats
    return Array.from(teamsMap.values()).map(team => {
      // Calculate average location or use first ranger's location
      const activeRangers = team.rangers.filter(r => r.status === 'active' || r.status === 'on_duty' || r.status === 'patrolling');
      const hasActiveRangers = activeRangers.length > 0;
      
      return {
        id: team.id,
        name: team.name,
        location: hasActiveRangers ? `${activeRangers[0].location || 'Field'}` : 'Standby',
        rangers: team.rangers.length,
        nextCheck: hasActiveRangers ? 'Active' : 'Standby',
        inactive: !hasActiveRangers
      };
    });
  }, [rangers]);

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh' }}>
      <Sidebar sidebarOpen={true} onLogout={handleLogout} />
      
      {/* Main Content */}
      <div className="responsive-content">
        {/* Hero Section */}
        <section className="dashboard-hero" style={{ 
          background: `linear-gradient(135deg, ${COLORS.forestGreen} 0%, ${COLORS.forestGreen}dd 100%)`, 
          padding: '32px 20px 28px 20px',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: `3px solid ${COLORS.borderLight}`
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Top Row: Title and Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ 
                  fontSize: '28px', 
                  fontWeight: 800, 
                  color: COLORS.white, 
                  marginBottom: '8px', 
                  letterSpacing: '-0.5px',
                  lineHeight: '1.2'
                }}>
                Wildlife Conservation Operations
              </h1>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'rgba(255, 255, 255, 0.85)', 
                  marginBottom: '16px', 
                  fontWeight: 500,
                  lineHeight: '1.5'
                }}>
                Real-time monitoring and protection of East African wildlife corridors
              </p>
              </div>
              
              {/* Status Indicators */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'flex-end'
              }}>
                <div style={{ 
                  display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  padding: '8px 14px', 
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    background: COLORS.success, 
                    borderRadius: '50%',
                    boxShadow: `0 0 8px ${COLORS.success}`,
                    animation: 'pulse 2s ease-in-out infinite'
                  }}></div>
                  <div style={{ color: COLORS.white, fontSize: '13px', fontWeight: 700 }}>
                    Live
              </div>
            </div>
                
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
                  gap: '8px', 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  padding: '8px 14px', 
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <MapPin className="w-4 h-4" style={{ color: COLORS.white }} />
                  <div style={{ color: COLORS.white, fontSize: '12px', fontWeight: 600 }}>
                    Kenya & Tanzania
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Row */}
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(255, 255, 255, 0.12)', 
                padding: '10px 16px', 
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ color: COLORS.white, fontSize: '18px', fontWeight: 800 }}>
                  {wsAnimals?.length || 0}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px', fontWeight: 600 }}>
                  Animals Tracked
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(255, 255, 255, 0.12)', 
                padding: '10px 16px', 
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ color: COLORS.white, fontSize: '18px', fontWeight: 800 }}>
                  {alertStats.active}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px', fontWeight: 600 }}>
                  Active Alerts
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(255, 255, 255, 0.12)', 
                padding: '10px 16px', 
                borderRadius: '8px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ color: COLORS.white, fontSize: '18px', fontWeight: 800 }}>
                  {rangers.filter(r => r.status === 'active' || r.status === 'on_duty' || r.status === 'patrolling').length}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px', fontWeight: 600 }}>
                  Rangers On Duty
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Status Overview Bar */}
        <section style={{ padding: '24px 40px', background: COLORS.secondaryBg, borderBottom: `2px solid ${COLORS.borderLight}` }}>
          <div style={{ 
            display: 'flex', 
            gap: '2px', 
            background: COLORS.borderLight, 
            borderRadius: '10px', 
            overflow: 'hidden', 
            height: '80px' 
          }}>
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: COLORS.tintCritical,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.zIndex = 1; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px', color: COLORS.burntOrange }}>{alertStats.active}</div>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Active Alerts</div>
              </div>
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: COLORS.tintRangers,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.zIndex = 1; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px', color: COLORS.forestGreen }}>{rangersOnDuty.length}</div>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Rangers On Duty</div>
              {rangersOnDuty.length > 0 && (
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '9px', 
                  color: COLORS.textSecondary,
                  textAlign: 'center',
                  maxWidth: '100%',
                  padding: '0 8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {rangersOnDuty.slice(0, 2).map(r => r.name).join(', ')}
                  {rangersOnDuty.length > 2 && ` +${rangersOnDuty.length - 2}`}
                </div>
              )}
            </div>
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: COLORS.tintSuccess,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.zIndex = 1; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px', color: COLORS.success }}>98%</div>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>System Health</div>
            </div>
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: COLORS.tintWarning,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.zIndex = 1; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
                <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px', color: COLORS.ochre }}>{wsAnimals?.length || 0}</div>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Tracked Animals</div>
                </div>
              </div>
        </section>

        {/* Content Section */}
        <section className="dashboard-content" style={{ padding: '0 20px 40px 20px' }}>
          {/* Corridor Overview and Security Operations - Side by Side, Same Size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Security Operations Card */}
            <div style={{ 
              background: COLORS.whiteCard, 
              borderRadius: '12px', 
              overflow: 'hidden', 
              border: `2px solid ${COLORS.borderLight}`,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <div style={{ 
                padding: '22px 26px', 
                borderBottom: `2px solid ${COLORS.borderLight}`, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: COLORS.secondaryBg 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    background: COLORS.burntOrange, 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '18px' 
                  }}>
                    <Shield size={20} color={COLORS.forestGreen} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: COLORS.textPrimary }}>Security Operations</h3>
                    <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '3px' }}>Real-time threat response</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ 
                    padding: '5px 12px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    background: COLORS.terracotta,
                    color: COLORS.white
                  }}>{alertStats.critical} Critical</span>
                  <span style={{ 
                    padding: '5px 12px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    background: COLORS.forestGreen,
                    color: COLORS.white
                  }}>{rangersOnDuty.length} Rangers</span>
                </div>
              </div>
              
              {/* Rangers On Duty List */}
              {rangersOnDuty.length > 0 && (
                <div style={{ 
                  padding: '0 26px 22px 26px',
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                  marginBottom: '22px'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: COLORS.textSecondary, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    marginBottom: '12px'
                  }}>
                    Active Rangers ({rangersOnDuty.length})
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px' 
                  }}>
                    {rangersOnDuty.map((ranger, idx) => (
                      <div
                        key={ranger.id || idx}
                        style={{
                          padding: '8px 12px',
                          background: COLORS.tintRangers,
                          borderRadius: '6px',
                          border: `1px solid ${COLORS.borderLight}`,
                          fontSize: '13px',
                          fontWeight: 600,
                          color: COLORS.textPrimary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <div style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: COLORS.success,
                          animation: 'pulse 2s infinite'
                        }}></div>
                        <span>{ranger.name}</span>
                        {ranger.team && ranger.team !== 'Unassigned' && (
                          <span style={{
                            fontSize: '11px',
                            color: COLORS.textSecondary,
                            fontWeight: 500
                          }}>
                            • {ranger.team}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Severity Summary */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
                gap: '2px', 
                background: COLORS.borderLight, 
                margin: '0 26px 22px 26px', 
                borderRadius: '8px', 
                overflow: 'hidden' 
              }}>
                <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.error }}>{alertStats.critical}</div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Critical</div>
                </div>
                <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.burntOrange }}>{alertStats.high}</div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>High</div>
                </div>
                <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.ochre }}>{alertStats.medium}</div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Medium</div>
                </div>
                <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.textSecondary }}>{alertStats.total}</div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total</div>
                </div>
              </div>

              {/* Incident List */}
              <div style={{ padding: '0 26px 26px 26px' }}>
                {incidents.length === 0 ? (
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: COLORS.textSecondary,
                    fontSize: '14px'
                  }}>
                    No active alerts at this time
                  </div>
                ) : (
                  incidents.map((incident) => {
                  const borderColor = incident.severity === 'critical' ? COLORS.error : 
                                     incident.severity === 'high' ? COLORS.burntOrange : 
                                     COLORS.ochre;
                  return (
                    <div 
                      key={incident.id}
                      style={{ 
                    padding: '18px',
                    borderRadius: '8px',
                        background: COLORS.secondaryBg, 
                    marginBottom: '14px',
                        borderLeft: `4px solid ${borderColor}`, 
                        borderRight: `2px solid ${COLORS.borderLight}`, 
                        borderTop: `2px solid ${COLORS.borderLight}`, 
                        borderBottom: `2px solid ${COLORS.borderLight}`,
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = COLORS.creamBg;
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = COLORS.secondaryBg;
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary }}>{incident.type}</div>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            background: COLORS.terracotta, 
                            color: COLORS.white, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.3px' 
                          }}>
                            {incident.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>{incident.time}</div>
                      </div>
                      <div style={{ fontSize: '14px', color: COLORS.textTertiary, marginBottom: '14px', lineHeight: '1.5' }}>
                        {incident.description}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: COLORS.textSecondary }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                            <MapPin className="w-4 h-4" />
                            {incident.location}
                    </div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            background: COLORS.tintRangers, 
                            padding: '5px 10px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            color: COLORS.forestGreen 
                          }}>
                            👥 {incident.rangers} Rangers
                        </div>
                        </div>
                        <button 
                          onClick={() => navigate('/patrol-operations')}
                          style={{ 
                          padding: '8px 18px', 
                          border: `2px solid ${COLORS.burntOrange}`, 
                          background: 'transparent', 
                          color: COLORS.burntOrange, 
                          borderRadius: '6px', 
                          fontSize: '13px', 
                          fontWeight: 700, 
                          cursor: 'pointer', 
                          transition: 'all 0.2s ease', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.3px' 
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = COLORS.burntOrange;
                          e.currentTarget.style.color = COLORS.white;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = COLORS.burntOrange;
                        }}
                        >
                        Respond
                      </button>
                  </div>
                  </div>
                  );
                  })
                )}
              </div>

              <div style={{ textAlign: 'center', padding: '18px', borderTop: `2px solid ${COLORS.borderLight}` }}>
                <button 
                  onClick={() => navigate('/wildlife/alert-hub')}
                  style={{ 
                    color: COLORS.burntOrange, 
                    background: 'transparent',
                    border: 'none',
                    textDecoration: 'none', 
                    fontSize: '13px', 
                    fontWeight: 700, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.3px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.terracotta; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.burntOrange; }}
                >
                </button>
                </div>
              </div>

            {/* Corridor Overview Card */}
            <div style={{ 
              background: COLORS.whiteCard, 
              borderRadius: '12px', 
              overflow: 'hidden', 
              border: `2px solid ${COLORS.borderLight}`,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <div style={{ 
                padding: '22px 26px', 
                borderBottom: `2px solid ${COLORS.borderLight}`, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: COLORS.secondaryBg 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    background: COLORS.forestGreen, 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}>
                    <MapPin className="w-5 h-5" style={{ color: COLORS.white }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: COLORS.textPrimary }}>Wildlife Tracking Map</h3>
                    <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '3px' }}>Real-time animal positions & alerts</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  flex: 1,
                  background: COLORS.borderLight, 
                  borderRadius: '10px', 
                  position: 'relative', 
                  overflow: 'hidden', 
                  border: `2px solid ${COLORS.borderMedium}`,
                  marginBottom: '16px',
                  minHeight: '400px'
                }}>
                  <MapComponent 
                    height="100%"
                    hideControls={true}
                    hideLegend={true}
                    hideMapInfo={true}
                    markers={[...mapMarkers, ...alertMarkers]}
                    corridors={corridors}
                    showCorridors={true}
                    riskZones={riskZones}
                    showRiskZones={true}
                    rangerPatrols={rangers.map(ranger => ({
                      id: ranger.id,
                      team_name: ranger.team || ranger.name,
                      status: ranger.status,
                      current_position: ranger.coordinates
                    }))}
                    showRangerPatrols={true}
                    showAnimalMovement={true}
                    predictedPaths={Object.values(predictions).map(p => ({
                      path: p.combinedPath || p.movementPath || [],
                      animal_id: p.animal_id,
                      model: p.lstmPredictions ? 'LSTM+BBMM' : 'BBMM',
                      confidence: 0.85
                    })).filter(p => p.path && p.path.length > 0)}
                    showPredictions={true}
                    behavioralStates={mapMarkers.reduce((acc, marker) => {
                      if (marker.id && marker.behaviorState) {
                        acc[marker.id] = {
                          state: marker.behaviorState,
                          confidence: 0.7
                        };
                      }
                      return acc;
                    }, {})}
                    riskHeatmap={Object.entries(environmentData).map(([key, value]) => ({
                      position: value.position || [0, 0],
                      intensity: value.intensity || value.habitat_score || 0.5,
                      type: value.type || 'habitat',
                      suitability: value.suitability,
                      status: value.status,
                      message: value.message
                    })).filter(h => h.position && h.position[0] !== 0 && h.position[1] !== 0)}
                  />
                  {mapMarkers.length === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      color: COLORS.textSecondary,
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      Loading animal data...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ranger Operations Card */}
          <div style={{ 
            background: COLORS.whiteCard, 
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: `2px solid ${COLORS.borderLight}` 
          }}>
            <div style={{ 
              padding: '22px 26px', 
              borderBottom: `2px solid ${COLORS.borderLight}`, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: COLORS.secondaryBg 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  background: COLORS.ochre, 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '18px' 
                }}>
                  🚶
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: COLORS.textPrimary }}>Ranger Operations</h3>
                  <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '3px' }}>Active patrol deployments</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: COLORS.textSecondary, fontWeight: 600 }}>
                Updated: {currentTime}
              </div>
            </div>

            <div style={{ padding: '22px 26px' }}>
              {patrols.map((patrol) => (
                <div 
                  key={patrol.id}
                  style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                    background: COLORS.secondaryBg, 
                  borderRadius: '8px',
                  marginBottom: '12px',
                    transition: 'all 0.2s',
                    border: `2px solid ${COLORS.borderLight}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = COLORS.creamBg;
                    e.currentTarget.style.borderColor = COLORS.borderMedium;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = COLORS.secondaryBg;
                    e.currentTarget.style.borderColor = COLORS.borderLight;
                  }}
                >
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: patrol.inactive ? COLORS.textSecondary : COLORS.success, 
                    marginRight: '16px' 
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '5px' }}>
                      {patrol.name}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                      {patrol.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Active Rangers List */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${COLORS.borderLight}` }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '16px' }}>Active Rangers</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {rangersOnDuty.slice(0, 6).map((ranger) => (
                  <div
                    key={ranger.id}
                    style={{
                      background: COLORS.whiteCard,
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '8px',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderMedium;
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderLight;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: COLORS.tintRangers
                    }}>
                      <Shield className="w-5 h-5" style={{ color: COLORS.forestGreen }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.textPrimary }}>
                        {ranger.name}
                      </div>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>
                        {ranger.team}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Alert Message Toast */}
      {alertMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: COLORS.error,
          color: COLORS.white,
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: 600,
          animation: 'slideIn 0.3s ease'
        }}>
          {alertMessage}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (min-width: 768px) {
          .dashboard-hero {
            padding: 40px 40px 36px 40px !important;
          }
          .dashboard-status {
            padding: 24px 40px !important;
          }
          .dashboard-content {
            padding: 0 40px 40px 40px !important;
          }
        }
        @media (max-width: 1024px) {
          .dashboard-content > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
