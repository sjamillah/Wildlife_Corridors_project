import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, MapPin, Users, Clock, Zap, Download, CheckCircle } from '@/components/shared/Icons';
import Sidebar from '@/components/shared/Sidebar';
import { BRAND_COLORS, COLORS } from '@/constants/Colors';
import { rangers, alerts as alertsService } from '@/services';
import { useWebSocket } from '@/hooks/useWebSocket';

const AlertHub = () => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [emergencies, setEmergencies] = useState([]);
  const [resolving, setResolving] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [updating, setUpdating] = useState(null); // Track which alert is being updated
  const navigate = useNavigate();

  // Helper function to calculate time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Transform alert from API format to display format (new structure)
  const transformAlert = useCallback((alert) => {
    const timestamp = alert.detected_at || alert.timestamp || alert.created_at || new Date().toISOString();
    const timeAgo = getTimeAgo(timestamp);
    const metadata = alert.metadata || {};
    
    // Extract location from new format (latitude/longitude)
    const lat = alert.latitude;
    const lon = alert.longitude;
    const coordinates = lat && lon ? [lat, lon] : (alert.coordinates || [0, 0]);
    
    // Build location string from metadata
    const location = metadata.real_world_location || 
                    metadata.zone_name || 
                    alert.conflict_zone_name ||
                    (coordinates[0] !== 0 && coordinates[1] !== 0 
                      ? `${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}` 
                      : 'Unknown Location');
    
    return {
      id: alert.id || `ALT-${Date.now()}`,
      type: alert.alert_type || alert.type || 'general',
      title: alert.title || 'Wildlife Alert',
      description: alert.message || alert.description || 'Alert details not available',
      location: location,
      timestamp: timeAgo,
      status: alert.status || 'active',
      priority: alert.severity || 'medium',
      severity: alert.severity || 'medium',
      animalId: alert.animal || alert.animal_id,
      animalName: (alert.animal_name || 'Unknown Animal').replace(/\s*-\s*[a-f0-9-]{36}$/i, '').replace(/\s*\([a-f0-9-]{36}\)$/i, '').trim(), // Remove UUIDs from animal name
      animalSpecies: alert.animal_species || alert.species || 'Unknown',
      coordinates: coordinates,
      conflictZoneName: alert.conflict_zone_name || metadata.zone_name,
      conflictZoneType: metadata.zone_type,
      corridor: metadata.corridor,
      distanceKm: metadata.distance_km,
      timeContext: metadata.time_context,
      responseTeam: alert.response_team || 'Response Team',
      estimatedRisk: alert.severity === 'critical' ? 'High' : alert.severity === 'high' ? 'Medium' : 'Low',
      story: alert.message || alert.description || 'Alert details not available',
      riskLevel: alert.severity || 'medium',
      source: alert.detected_via || alert.source || 'system',
      rawTimestamp: timestamp,
      metadata: metadata,
      acknowledgedAt: alert.acknowledged_at,
      resolvedAt: alert.resolved_at,
      acknowledgedBy: alert.acknowledged_by_name || alert.acknowledged_by,
      // Team info - handle both object and string formats, or create default
      team: alert.team || (alert.response_team ? {
        name: alert.response_team,
        description: 'Response team assigned to this alert',
        members: []
      } : null),
    };
  }, []);

  // WebSocket integration for real-time alerts (define first)
  const { 
    alerts: wsAlerts
  } = useWebSocket({
    autoConnect: true,
    onAlert: (alert) => {
      console.log('New alert received via WebSocket:', alert);
      // Add new alert to the list
      setAlerts(prev => {
        // Check if alert already exists (by ID only - don't create duplicates for same alert)
        const transformedAlert = transformAlert(alert);
        const exists = prev.find(a => a.id === transformedAlert.id);
        if (exists) {
          console.log('🔔 Duplicate alert ignored:', transformedAlert.id);
          return prev;
        }
        // Add new alert at the beginning
        return [transformedAlert, ...prev];
      });
    }
  });

  // Fetch alerts from API - get ALL alerts (not just active) to include mobile-created ones
  const fetchAlerts = useCallback(async () => {
    try {
      console.log('🔔 Fetching all alerts from API...');
      // Fetch all alerts, not just active ones, to include mobile-created alerts
      const data = await alertsService.getAll(); // No status filter to get all alerts
      console.log('🔔 Alerts API response:', data);
      // Handle both array and object responses
      const alertsArray = Array.isArray(data) ? data : (data.results || data || []);
      console.log('🔔 Parsed alerts data:', alertsArray.length, 'alerts');
      
      // Transform API alerts to display format
      const transformedAlerts = alertsArray.map(transformAlert);
      console.log('🔔 Transformed alerts:', transformedAlerts.length);
      
      // Replace alerts instead of merging to avoid duplicates
      setAlerts(transformedAlerts);
    } catch (error) {
      console.error('❌ Failed to fetch alerts:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty array if fetch fails (no static fallback)
      setAlerts([]);
    }
  }, [transformAlert]);

  // Fetch alerts once on mount and merge with WebSocket - single fetch
  useEffect(() => {
    // Initial fetch
    fetchAlerts();
    
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);
  
  // Merge WebSocket alerts with fetched alerts (no separate fetch)
  useEffect(() => {
    if (wsAlerts && wsAlerts.length > 0) {
      console.log('🔔 WebSocket alerts received:', wsAlerts.length);
      const transformed = wsAlerts.map(transformAlert);
      setAlerts(prev => {
        // Merge without duplicates
        const existingIds = new Set(prev.map(a => a.id));
        const newAlerts = transformed.filter(a => !existingIds.has(a.id));
        if (newAlerts.length > 0) {
          console.log('🔔 Adding', newAlerts.length, 'new alerts from WebSocket');
          return [...newAlerts, ...prev];
        }
        return prev;
      });
    }
  }, [wsAlerts, transformAlert]);

  // Use only fetched alerts - no static fallback
  const displayAlerts = alerts;

  // Fetch emergencies from backend
  const fetchEmergencies = useCallback(async () => {
    try {
      const data = await rangers.logs.getEmergencies();
      setEmergencies(data || []);
      console.log(`Loaded ${(data || []).length} active emergencies`);
    } catch (error) {
      console.error('Failed to fetch emergencies:', error);
      setEmergencies([]);
    }
  }, []);

  useEffect(() => {
    fetchEmergencies();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchEmergencies, 30000);
    return () => clearInterval(interval);
  }, [fetchEmergencies]);

  const resolveEmergency = async (emergencyId) => {
    setResolving(emergencyId);
    try {
      await rangers.logs.resolve(emergencyId);
      await fetchEmergencies();
      console.log('Emergency resolved:', emergencyId);
    } catch (error) {
      console.error('Failed to resolve emergency:', error);
    } finally {
      setResolving(null);
    }
  };

  // Handle acknowledging an alert
  const handleAcknowledge = async (alertId) => {
    if (!alertId) return;
    
    setUpdating(alertId);
    try {
      await alertsService.acknowledge(alertId);
      console.log('Alert acknowledged:', alertId);
      
      // Update the alert in local state
      setAlerts(prev => prev.map(alert => {
        if (alert.id === alertId) {
          return { ...alert, status: 'acknowledged', acknowledgedAt: new Date().toISOString() };
        }
        return alert;
      }));
      
      // Update selected alert if it's the one being acknowledged
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(prev => ({
          ...prev,
          status: 'acknowledged',
          acknowledgedAt: new Date().toISOString()
        }));
      }
      
      // Refresh alerts to get latest data
      await fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      alert('Failed to acknowledge alert. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  // Handle setting alert status to investigating
  const handleInvestigating = async (alertId) => {
    if (!alertId) return;
    
    setUpdating(alertId);
    try {
      await alertsService.updateStatus(alertId, 'investigating');
      console.log('Alert status set to investigating:', alertId);
      
      // Update the alert in local state
      setAlerts(prev => prev.map(alert => {
        if (alert.id === alertId) {
          return { ...alert, status: 'investigating' };
        }
        return alert;
      }));
      
      // Update selected alert if it's the one being updated
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(prev => ({
          ...prev,
          status: 'investigating'
        }));
      }
      
      // Refresh alerts to get latest data
      await fetchAlerts();
    } catch (error) {
      console.error('Failed to update alert status:', error);
      alert('Failed to update alert status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  // Combine fetched alerts with backend emergencies
  const combinedAlerts = useMemo(() => {
    return [
      ...displayAlerts,
      ...emergencies.map(emergency => {
        const timestamp = emergency.timestamp ? getTimeAgo(emergency.timestamp) : 'Unknown';
        return {
      id: emergency.id,
      type: 'Emergency',
      title: emergency.emergency_type || 'Emergency Alert',
      description: emergency.description || 'Active emergency situation',
          location: emergency.lat && emergency.lon ? `${emergency.lat.toFixed(4)}, ${emergency.lon.toFixed(4)}` : 'Unknown Location',
          timestamp: timestamp,
      status: emergency.status || 'active',
      priority: emergency.priority || 'high',
      isEmergency: true,
      emergencyData: emergency,
          team: null, // Emergencies may not have team info
        };
      })
  ];
  }, [displayAlerts, emergencies]);

  const handleLogout = async () => {
    try {
      // Use auth service to properly logout (clears all tokens and notifies backend)
      await rangers.logout();
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

  const filteredAlerts = useMemo(() => {
    return combinedAlerts.filter(alert => {
      const matchesSearch = (alert.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           String(alert.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (alert.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // Case-insensitive status matching
      const alertStatus = (alert.status || '').toLowerCase();
      const filterStatusLower = filterStatus.toLowerCase();
      const matchesFilter = filterStatus === 'all' || 
                           alertStatus === filterStatusLower ||
                           (filterStatusLower === 'active' && (alertStatus === 'active' || alertStatus === 'new' || alertStatus === 'pending'));
    
    return matchesSearch && matchesFilter;
  });
  }, [combinedAlerts, searchQuery, filterStatus]);

  // Removed auto-select - user must click a card to open popup

  // Calculate status counts from actual alerts list (all alerts, not filtered)
  const alertCounts = useMemo(() => {
    // Always use combinedAlerts to show total counts from the actual alerts list
    const allAlerts = combinedAlerts;
    return {
      all: allAlerts.length,
      active: allAlerts.filter(a => {
        const status = (a.status || '').toLowerCase();
        return status === 'active' || status === 'new' || status === 'pending';
      }).length,
      acknowledged: allAlerts.filter(a => {
        const status = (a.status || '').toLowerCase();
        return status === 'acknowledged';
      }).length,
      investigating: allAlerts.filter(a => {
        const status = (a.status || '').toLowerCase();
        return status === 'investigating';
      }).length,
      resolved: allAlerts.filter(a => {
        const status = (a.status || '').toLowerCase();
        return status === 'resolved' || status === 'closed';
      }).length
    };
  }, [combinedAlerts]);

  const getSeverityColor = (priority) => {
    switch (priority) {
      case 'critical': return COLORS.error;
      case 'high': return COLORS.ochre;
      case 'medium': return COLORS.warning;
      default: return COLORS.success;
    }
  };

  const getSeverityBg = (priority) => {
    switch (priority) {
      case 'critical': return COLORS.tintCritical;
      case 'high': return COLORS.tintWarning;
      case 'medium': return COLORS.tintWarning;
      default: return COLORS.tintSuccess;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.error;
      case 'acknowledged': return COLORS.info;
      case 'investigating': return COLORS.ochre;
      case 'resolved': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'active': return COLORS.tintCritical;
      case 'acknowledged': return COLORS.tintRangers;
      case 'investigating': return COLORS.tintWarning;
      case 'resolved': return COLORS.tintSuccess;
      default: return COLORS.creamBg;
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div className="responsive-content">
        {/* Page Header */}
        <section className="alert-header" style={{ background: COLORS.forestGreen, padding: '28px 20px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '6px', letterSpacing: '-0.6px' }}>
              Alert Management
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Monitor and respond to conservation alerts
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Active count */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.error }}></div>
              Active: {alertCounts.active}
            </div>
          </div>
        </section>

        {/* Filter Buttons Bar */}
        <section style={{ background: COLORS.secondaryBg, padding: '20px 20px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <style>{`
            @media (min-width: 768px) {
              .status-bar {
                padding: 20px 40px !important;
              }
            }
          `}</style>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {['all', 'active', 'acknowledged', 'investigating', 'resolved'].map((filter) => {
              const isActive = filterStatus === filter;
              const label = filter === 'all' ? 'All' :
                           filter === 'active' ? 'Active' :
                           filter === 'acknowledged' ? 'Acknowledged' :
                           filter === 'investigating' ? 'Investigating' : 'Resolved';
              
              const count = filter === 'all' ? alertCounts.all :
                           filter === 'active' ? alertCounts.active :
                           filter === 'acknowledged' ? alertCounts.acknowledged :
                           filter === 'investigating' ? alertCounts.investigating : alertCounts.resolved;
              
              const bgColor = isActive ? 
                (filter === 'active' ? COLORS.tintCritical :
                 filter === 'acknowledged' ? COLORS.tintRangers :
                 filter === 'investigating' ? COLORS.tintWarning :
                 filter === 'resolved' ? COLORS.tintSuccess : COLORS.forestGreen) :
                COLORS.whiteCard;
              
              const textColor = isActive ?
                (filter === 'active' ? COLORS.error :
                 filter === 'acknowledged' ? COLORS.info :
                 filter === 'investigating' ? COLORS.ochre :
                 filter === 'resolved' ? COLORS.success : COLORS.white) :
                COLORS.textSecondary;

              return (
                <button
                  key={filter}
                  onClick={() => setFilterStatus(filter)}
                  style={{
                    padding: '12px 24px',
                    border: `2px solid ${isActive ? textColor : COLORS.borderLight}`,
                    background: bgColor,
                    color: textColor,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = COLORS.borderMedium;
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = COLORS.borderLight;
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span>{label}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: isActive ? 'rgba(255,255,255,0.2)' : COLORS.secondaryBg,
                    fontSize: '12px',
                    fontWeight: 800
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Alerts Section - Responsive Grid Layout */}
        <section style={{ padding: '32px 20px', minHeight: 'calc(100vh - 240px)' }}>
          <style>{`
            @media (min-width: 768px) {
              .alerts-section {
                padding: 32px 40px !important;
              }
            }
          `}</style>
          <div className="alerts-section" style={{ padding: '32px 20px' }}>
            {/* Search and Filters */}
            <div style={{ marginBottom: '28px' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '500px' }}>
                <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSecondary }} />
                <input
                  type="text"
                  placeholder="Search alerts by title, location, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px 14px 46px',
                    border: `2px solid ${COLORS.borderLight}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    background: COLORS.whiteCard,
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.forestGreen;
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,93,69,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Alert Cards Grid - Responsive */}
            {filteredAlerts.length === 0 ? (
              <div style={{
                textAlign: 'left',
                padding: '80px 20px',
                background: COLORS.whiteCard,
                borderRadius: '12px',
                border: `2px dashed ${COLORS.borderLight}`
              }}>
                <AlertTriangle className="w-12 h-12" style={{ color: COLORS.textSecondary, marginBottom: '16px' }} />
                <div style={{ fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px', textAlign: 'left' }}>
                  No Alerts Found
                </div>
                <div style={{ fontSize: '14px', color: COLORS.textSecondary, textAlign: 'left' }}>
                  {alerts.length === 0
                    ? 'No alerts have been created yet. Alerts from mobile app reports will appear here.'
                    : 'No alerts match your current filter. Try adjusting your search or filter criteria.'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {filteredAlerts.map((alert) => {
                const severityColor = getSeverityColor(alert.priority);
                  const statusColor = getStatusColor(alert.status);
                  const statusBg = getStatusBg(alert.status);

                return (
                  <div
                    key={alert.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedAlert(alert);
                      }}
                    style={{
                      background: COLORS.whiteCard,
                      border: `1px solid ${selectedAlert?.id === alert.id ? COLORS.burntOrange : COLORS.borderLight}`,
                        borderRadius: '12px',
                        padding: '24px',
                      cursor: 'pointer',
                      position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedAlert?.id === alert.id ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAlert?.id !== alert.id) {
                        e.currentTarget.style.borderColor = COLORS.borderMedium;
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAlert?.id !== alert.id) {
                        e.currentTarget.style.borderColor = COLORS.borderLight;
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                          e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                      {/* Top Accent Bar */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        borderRadius: '12px 12px 0 0',
                      background: severityColor
                    }}></div>

                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '8px', lineHeight: 1.3, textAlign: 'left' }}>
                      {alert.title}
                          </div>
                        </div>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: statusBg,
                          color: statusColor,
                          whiteSpace: 'nowrap'
                        }}>
                          {alert.status}
                        </span>
                    </div>

                      {/* Description */}
                      <div style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '16px', lineHeight: 1.6, textAlign: 'left' }}>
                        {alert.description}
                      </div>

                      {/* Location and Time */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: `1px solid ${COLORS.borderLight}`, textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: COLORS.textSecondary, textAlign: 'left' }}>
                      <MapPin className="w-4 h-4" />
                          <span style={{ textAlign: 'left' }}>{alert.location}</span>
                    </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: COLORS.textSecondary, textAlign: 'left' }}>
                          <Clock className="w-4 h-4" />
                          <span style={{ textAlign: 'left' }}>{alert.timestamp}</span>
                        </div>
                        {alert.animalName && (
                          <div style={{ fontSize: '13px', color: COLORS.textSecondary, fontWeight: 500, textAlign: 'left' }}>
                            Animal: {alert.animalName} {alert.animalSpecies && `(${alert.animalSpecies})`}
                          </div>
                        )}
                      </div>

                  </div>
                );
              })}
            </div>
            )}

            {/* Details Panel - Modal/Overlay Style */}
            {selectedAlert && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedAlert(null);
              }}
              >
                <div style={{
                  background: COLORS.whiteCard,
                  borderRadius: '16px',
                  width: '100%',
                  maxWidth: '600px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '40px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}
                onClick={(e) => {
                  // Don't close if clicking inside the modal content
                  if (e.target === e.currentTarget) {
                    setSelectedAlert(null);
                  }
                }}
                >
                  {/* Close Button - Must be clickable */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Close button clicked');
                      setSelectedAlert(null);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: COLORS.secondaryBg,
                      border: `2px solid ${COLORS.borderMedium}`,
                      fontSize: '28px',
                      lineHeight: '1',
                      color: COLORS.textPrimary,
                      cursor: 'pointer',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      zIndex: 1003,
                      padding: 0,
                      margin: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      fontWeight: 'bold'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = COLORS.error;
                      e.currentTarget.style.borderColor = COLORS.error;
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = COLORS.secondaryBg;
                      e.currentTarget.style.borderColor = COLORS.borderMedium;
                      e.currentTarget.style.color = COLORS.textPrimary;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    aria-label="Close alert details"
                  >
                    ×
                  </button>
            {selectedAlert ? (
              <>
                {/* Details Header */}
                <div style={{ marginBottom: '28px' }}>
                  {/* Icon */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '10px',
                    background: getSeverityBg(selectedAlert.priority),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    marginBottom: '16px'
                  }}>
                    <AlertTriangle className="w-7 h-7" style={{ color: getSeverityColor(selectedAlert.priority) }} />
                  </div>
                  {/* Title */}
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: COLORS.textPrimary, marginBottom: '6px', lineHeight: 1.3, textAlign: 'left' }}>
                    {selectedAlert.title}
                  </h2>
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: getStatusBg(selectedAlert.status),
                      color: getStatusColor(selectedAlert.status)
                    }}>
                      {selectedAlert.status}
                    </span>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: selectedAlert.priority === 'critical' ? COLORS.error :
                                 selectedAlert.priority === 'high' ? COLORS.ochre :
                                 selectedAlert.priority === 'medium' ? COLORS.warning : COLORS.success,
                      color: 'white'
                    }}>
                      {selectedAlert.priority}
                    </span>
                  </div>
                </div>

                {/* Story Section */}
                <div style={{ background: COLORS.secondaryBg, padding: '20px', marginBottom: '24px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                    {selectedAlert.isEmergency ? 'Emergency Details' : 'Story'}
                  </div>
                  <div style={{ fontSize: '15px', color: COLORS.textPrimary, lineHeight: 1.8, textAlign: 'left' }}>
                    {selectedAlert.story || selectedAlert.description}
                  </div>
                </div>

                {/* Emergency Actions */}
                {selectedAlert.isEmergency && selectedAlert.status === 'active' && (
                  <div style={{ marginBottom: '32px' }}>
                    <button
                      onClick={() => resolveEmergency(selectedAlert.id)}
                      disabled={resolving === selectedAlert.id}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        background: resolving === selectedAlert.id ? COLORS.borderLight : COLORS.success,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: resolving === selectedAlert.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (resolving !== selectedAlert.id) {
                          e.currentTarget.style.background = '#059669';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (resolving !== selectedAlert.id) {
                          e.currentTarget.style.background = COLORS.success;
                        }
                      }}
                    >
                      <CheckCircle style={{ width: 18, height: 18 }} />
                      {resolving === selectedAlert.id ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                  </div>
                )}

                {/* Info Grid */}
                <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ paddingBottom: '12px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', textAlign: 'left' }}>
                      Location
                    </div>
                    <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                      <MapPin className="w-4.5 h-4.5" style={{ color: COLORS.textSecondary }} />
                      <span style={{ textAlign: 'left' }}>{selectedAlert.location}</span>
                    </div>
                  </div>

                  {selectedAlert.animalName && (
                  <div style={{ paddingBottom: '12px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', textAlign: 'left' }}>
                      Animal
                    </div>
                      <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: 500, textAlign: 'left' }}>
                        {selectedAlert.animalName} {selectedAlert.animalSpecies && `(${selectedAlert.animalSpecies})`}
                    </div>
                  </div>
                  )}

                  <div style={{ paddingBottom: '12px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', textAlign: 'left' }}>
                      Timestamp
                    </div>
                    <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                      <Clock className="w-4.5 h-4.5" style={{ color: COLORS.textSecondary }} />
                      <span style={{ textAlign: 'left' }}>{selectedAlert.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Team Section - Only show if team exists */}
                {selectedAlert.team && (
                <div style={{ paddingBottom: '16px', borderBottom: `1px solid ${COLORS.borderLight}`, marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Users className="w-4.5 h-4.5" style={{ color: COLORS.textSecondary }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPrimary, textAlign: 'left' }}>
                        {selectedAlert.team.name || selectedAlert.responseTeam || 'Response Team'}
                    </div>
                  </div>
                    {selectedAlert.team.description && (
                  <div style={{ fontSize: '14px', color: BRAND_COLORS.TEXT_TERTIARY, lineHeight: 1.6, textAlign: 'left' }}>
                    {selectedAlert.team.description}
                  </div>
                    )}
                </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${COLORS.borderLight}` }}>
                  {/* Primary Button */}
                  <button
                    onClick={() => console.log('Respond to', selectedAlert.id)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: COLORS.burntOrange,
                      border: 'none',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
                  >
                    <Zap className="w-4 h-4" />
                    Respond
                  </button>
                  {/* Secondary Buttons */}
                  {selectedAlert.status !== 'acknowledged' && selectedAlert.status !== 'resolved' && (
                  <button
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      disabled={updating === selectedAlert.id}
                    style={{
                      width: '100%',
                      padding: '12px',
                        background: updating === selectedAlert.id ? COLORS.borderLight : 'transparent',
                      border: `1px solid ${COLORS.borderLight}`,
                        color: updating === selectedAlert.id ? COLORS.textSecondary : COLORS.textSecondary,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                        cursor: updating === selectedAlert.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: updating === selectedAlert.id ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (updating !== selectedAlert.id) {
                      e.currentTarget.style.borderColor = COLORS.borderMedium;
                      e.currentTarget.style.background = COLORS.secondaryBg;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (updating !== selectedAlert.id) {
                      e.currentTarget.style.borderColor = COLORS.borderLight;
                      e.currentTarget.style.background = 'transparent';
                        }
                    }}
                  >
                      {updating === selectedAlert.id ? 'Updating...' : 'Acknowledge'}
                  </button>
                  )}
                  {selectedAlert.status !== 'investigating' && selectedAlert.status !== 'resolved' && (
                    <button
                      onClick={() => handleInvestigating(selectedAlert.id)}
                      disabled={updating === selectedAlert.id}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: updating === selectedAlert.id ? COLORS.borderLight : 'transparent',
                        border: `1px solid ${COLORS.borderLight}`,
                        color: updating === selectedAlert.id ? COLORS.textSecondary : COLORS.textSecondary,
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        cursor: updating === selectedAlert.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: updating === selectedAlert.id ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (updating !== selectedAlert.id) {
                          e.currentTarget.style.borderColor = COLORS.borderMedium;
                          e.currentTarget.style.background = COLORS.secondaryBg;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (updating !== selectedAlert.id) {
                          e.currentTarget.style.borderColor = COLORS.borderLight;
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {updating === selectedAlert.id ? 'Updating...' : 'Mark as Investigating'}
                    </button>
                  )}
                  <button
                    onClick={() => console.log('Export', selectedAlert.id)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'transparent',
                      border: `1px solid ${COLORS.borderLight}`,
                      color: COLORS.textSecondary,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderMedium;
                      e.currentTarget.style.background = COLORS.secondaryBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderLight;
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export Details
                  </button>
                </div>
              </>
            ) : null}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .alert-header {
            padding: 28px 40px !important;
          }
          .status-bar {
            padding: 20px 40px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AlertHub;
