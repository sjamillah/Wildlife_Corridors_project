import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Wifi, Settings } from '@/components/shared/Icons';
import Sidebar from '@/components/shared/Sidebar';
import { COLORS, rgba } from '@/constants/Colors';
import { rangers as rangersService, animals as animalsService } from '@/services';
import { useWebSocket } from '@/hooks/useWebSocket';

const LiveTracking = () => {
  const navigate = useNavigate();
  
  // WebSocket integration for real-time updates
  const { 
    animals: wsAnimals, 
    isConnected,
    alerts: wsAlerts
  } = useWebSocket({
    autoConnect: true,
    onAlert: (alert) => {
      console.log('Alert received:', alert);
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(
          alert.icon + ' ' + (alert.severity === 'critical' || alert.severity === 'high' ? 'CRITICAL ALERT' : 'Wildlife Alert'),
          {
            body: `${alert.animalName || 'Unknown animal'}\n${alert.message || 'Alert received'}`,
            icon: '/favicon.webp'
          }
        );
      }
    },
    onPositionUpdate: (data) => {
      console.log('Position update received:', data.animals?.length || 0, 'animals');
    }
  });
  
  const [, setSelectedDevice] = useState(null);
  const [devices, setDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    navigate('/auth');
  };

  // Transform WebSocket animals and fetch rangers
  useEffect(() => {
    const fetchAndMergeData = async () => {
      try {
        // Fetch rangers data
        const rangersResponse = await rangersService.getAll().catch(err => {
          console.log('Rangers fetch error:', err);
          return { results: [] };
        });
        
        const rangersList = rangersResponse.results || rangersResponse || [];
        
        // Transform WebSocket animals to device format
        const animalDevices = (wsAnimals || [])
          .filter(animal => animal.status === 'active')
          .map((animal) => {
            const activity = animal.movement?.activity_type || animal.behavior_state || 'unknown';
            const riskLevel = animal.risk_level || 'low';
            const speed = animal.movement?.speed_kmh || animal.speed || 0;
            
            // Determine status color based on state
            let deviceStatus = 'Active';
            if (riskLevel === 'critical' || riskLevel === 'high') {
              deviceStatus = 'Critical';
            } else if (riskLevel === 'medium') {
              deviceStatus = 'Warning';
            }
            
            // Check for recent alerts
            const recentAlert = wsAlerts.find(alert => 
              alert.animalId === animal.id && 
              (Date.now() - new Date(alert.timestamp).getTime()) < 300000 // Within last 5 minutes
            );
            
            return {
              id: `animal-${animal.id}`,
              name: animal.name || `${animal.species} #${animal.collar_id?.slice(0, 8) || animal.id}`,
              deviceId: animal.collar_id || `COL-${animal.id}`,
              status: deviceStatus,
              battery: animal.collar_battery || 85,
              signalStrength: animal.signal_strength || 80,
              lastPing: animal.last_updated ? new Date(animal.last_updated).getTime() : Date.now(),
              location: animal.current_position?.lat && animal.current_position?.lon ? 
                `${animal.current_position.lat.toFixed(4)}°, ${animal.current_position.lon.toFixed(4)}°` : 
                animal.last_known_location || 'No GPS Data',
              type: 'GPS Collar',
              category: 'animal',
              species: animal.species || 'Unknown',
              activity: activity,
              speed: speed,
              riskLevel: riskLevel,
              hasAlert: !!recentAlert,
              alertIcon: recentAlert?.icon || null,
              alertSeverity: recentAlert?.severity || null,
              pathColor: animal.pathColor || COLORS.success,
            };
          });

        const rangerDevices = rangersList.map((ranger) => ({
          id: `ranger-${ranger.id}`,
          name: ranger.name || ranger.user_name || `Ranger #${ranger.id}`,
          deviceId: ranger.badge_number || `BADGE-${ranger.id}`,
          status: ranger.current_status === 'on_duty' ? 'Active' : 'Offline',
          battery: 100,
          signalStrength: ranger.current_status === 'on_duty' ? 95 : 0,
          lastPing: ranger.last_active ? new Date(ranger.last_active).getTime() : Date.now(),
          location: ranger.last_lat && ranger.last_lon ? 
            `${ranger.last_lat.toFixed(4)}°, ${ranger.last_lon.toFixed(4)}°` : 
            'No GPS Data',
          type: 'Ranger Device',
          category: 'ranger',
          team: ranger.team_name || 'Unassigned'
        }));
        
        const allDevices = [...animalDevices, ...rangerDevices];
        setDevices(allDevices);
        
        console.log(`Displaying ${animalDevices.length} active animals (via WebSocket) + ${rangerDevices.length} rangers`);
      } catch (err) {
        console.error('Error fetching tracking data:', err);
      }
    };

    fetchAndMergeData();
  }, [wsAnimals, wsAlerts]);

  // Fallback: If WebSocket is not connected, fetch via REST API
  useEffect(() => {
    if (!isConnected) {
      const fetchTrackingData = async () => {
        try {
          console.log('WebSocket disconnected. Fetching via REST API...');
          
          const [animalsResponse, rangersResponse] = await Promise.all([
            animalsService.getAll({ status: 'active' }).catch(err => { 
              console.log('Animals fetch error:', err);
              return { results: [] };
            }),
            rangersService.getAll().catch(err => {
              console.log('Rangers fetch error:', err);
              return { results: [] };
            })
          ]);
          
          const animalsList = animalsResponse.results || animalsResponse || [];
          const rangersList = rangersResponse.results || rangersResponse || [];
          
          const animalDevices = animalsList
            .filter(animal => animal.status === 'active')
            .map((animal) => ({
              id: `animal-${animal.id}`,
              name: animal.name || `${animal.species} #${animal.collar_id?.slice(0, 8) || animal.id}`,
              deviceId: animal.collar_id || `COL-${animal.id}`,
              status: 'Active',
              battery: animal.collar_battery || 85,
              signalStrength: animal.signal_strength || 80,
              lastPing: animal.last_seen ? new Date(animal.last_seen).getTime() : Date.now(),
              location: animal.last_lat && animal.last_lon ? 
                `${animal.last_lat.toFixed(4)}°, ${animal.last_lon.toFixed(4)}°` : 
                animal.last_known_location || 'No GPS Data',
              type: 'GPS Collar',
              category: 'animal',
              species: animal.species || 'Unknown'
            }));

          const rangerDevices = rangersList.map((ranger) => ({
            id: `ranger-${ranger.id}`,
            name: ranger.name || ranger.user_name || `Ranger #${ranger.id}`,
            deviceId: ranger.badge_number || `BADGE-${ranger.id}`,
            status: ranger.current_status === 'on_duty' ? 'Active' : 'Offline',
            battery: 100,
            signalStrength: ranger.current_status === 'on_duty' ? 95 : 0,
            lastPing: ranger.last_active ? new Date(ranger.last_active).getTime() : Date.now(),
            location: ranger.last_lat && ranger.last_lon ? 
              `${ranger.last_lat.toFixed(4)}°, ${ranger.last_lon.toFixed(4)}°` : 
              'No GPS Data',
            type: 'Ranger Device',
            category: 'ranger',
            team: ranger.team_name || 'Unassigned'
          }));
          
          const allDevices = [...animalDevices, ...rangerDevices];
          setDevices(allDevices);
        } catch (err) {
          console.error('Error fetching tracking data:', err);
          setDevices([]);
        }
      };

      fetchTrackingData();
      const interval = setInterval(fetchTrackingData, 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const formatTimeSince = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.status === 'Active').length;
  const lowBatteryDevices = devices.filter(d => d.battery < 30).length;
  const weakSignalDevices = devices.filter(d => d.signalStrength < 50).length;
  const offlineDevices = devices.filter(d => d.status === 'Offline').length;

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.deviceId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'active' && device.status === 'Active') ||
                         (activeFilter === 'low-battery' && device.battery < 30) ||
                         (activeFilter === 'weak-signal' && device.signalStrength < 50) ||
                         (activeFilter === 'offline' && device.status === 'Offline') ||
                         (activeFilter === 'animals' && device.category === 'animal') ||
                         (activeFilter === 'rangers' && device.category === 'ranger');
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return COLORS.success;
      case 'Warning': return COLORS.ochre;
      case 'Critical': return COLORS.error;
      case 'Low Battery': return COLORS.ochre;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Active': return COLORS.tintSuccess;
      case 'Warning': return COLORS.tintWarning;
      case 'Critical': return COLORS.tintCritical;
      case 'Low Battery': return COLORS.tintWarning;
      default: return COLORS.creamBg;
    }
  };

  const getBatteryColor = (battery) => {
    if (battery > 70) return COLORS.success;
    if (battery > 30) return COLORS.ochre;
    return COLORS.error;
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={{ marginLeft: '260px', minHeight: '100vh' }}>
        <section style={{ background: COLORS.forestGreen, padding: '28px 40px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '6px', letterSpacing: '-0.6px' }}>
              Device Tracking
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Monitor all tracking devices in real-time
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* WebSocket Connection Status */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: isConnected ? COLORS.success : COLORS.ochre, 
                animation: isConnected ? 'pulse 2s ease-in-out infinite' : 'none' 
              }}></div>
              {isConnected ? 'Live (WebSocket)' : 'Offline (REST API)'}
            </div>
            <button style={{ 
              background: 'transparent', 
              border: '2px solid rgba(255, 255, 255, 0.3)', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              fontSize: '13px', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button style={{ 
              background: COLORS.burntOrange, 
              border: `2px solid ${COLORS.burntOrange}`, 
              color: 'white', 
              padding: '10px 20px', 
              borderRadius: '6px', 
              fontSize: '14px', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; e.currentTarget.style.borderColor = COLORS.terracotta; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; e.currentTarget.style.borderColor = COLORS.burntOrange; }}
            >
              <Plus className="w-4 h-4" />
              Add Device
            </button>
          </div>
        </section>

        <section style={{ background: COLORS.secondaryBg, padding: '20px 40px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <div style={{ display: 'flex', gap: '2px', background: COLORS.borderLight, borderRadius: '8px', overflow: 'hidden', height: '70px' }}>
            <div 
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: COLORS.tintRangers,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.forestGreen, marginBottom: '4px' }}>
                {totalDevices}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Total
              </div>
            </div>

            <div 
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: rgba('burntOrange', 0.1),
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.burntOrange, marginBottom: '4px' }}>
                {activeDevices}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Active
              </div>
            </div>

            <div 
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: COLORS.tintWarning,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.ochre, marginBottom: '4px' }}>
                {lowBatteryDevices}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Battery Low
              </div>
            </div>

            <div 
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: rgba('statusInfo', 0.1),
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.info, marginBottom: '4px' }}>
                {weakSignalDevices}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Signal Weak
              </div>
            </div>

            <div 
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: COLORS.tintCritical,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.error, marginBottom: '4px' }}>
                {offlineDevices}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Offline
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary }}>Devices</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, maxWidth: '600px', marginLeft: 'auto' }}>
              <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSecondary }} />
                <input
                  type="text"
                  placeholder="Search devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    background: COLORS.whiteCard,
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'animals', 'rangers', 'active', 'low-battery', 'weak-signal', 'offline'].map((filter) => {
                  const isActive = activeFilter === filter;
                  
                  const label = filter === 'all' ? 'All' :
                               filter === 'animals' ? 'Animals' :
                               filter === 'rangers' ? 'Rangers' :
                               filter === 'active' ? 'Active' :
                               filter === 'low-battery' ? 'Low Battery' :
                               filter === 'weak-signal' ? 'Weak Signal' : 'Offline';

                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      style={{
                        padding: '8px 16px',
                        border: `1px solid ${isActive ? COLORS.forestGreen : COLORS.borderLight}`,
                        background: isActive ? COLORS.forestGreen : COLORS.whiteCard,
                        color: isActive ? COLORS.white : COLORS.textSecondary,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = COLORS.borderMedium;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = COLORS.borderLight;
                        }
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredDevices.map((device) => {
              const statusColor = getStatusColor(device.status);
              const statusBg = getStatusBg(device.status);
              const batteryColor = getBatteryColor(device.battery);
              const accentColor = device.status === 'Active' ? COLORS.success :
                                device.status === 'Warning' || device.status === 'Low Battery' ? COLORS.ochre :
                                device.status === 'Critical' ? COLORS.error : COLORS.textSecondary;

              return (
                <div
                  key={device.id}
                  style={{
                    background: COLORS.whiteCard,
                    border: `1px solid ${COLORS.borderLight}`,
                    borderLeft: device.hasAlert ? `4px solid ${accentColor}` : `1px solid ${COLORS.borderLight}`,
                    borderRadius: '10px',
                    padding: '20px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderMedium;
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => setSelectedDevice(device)}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    borderRadius: '10px 10px 0 0',
                    background: accentColor
                  }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        background: device.status === 'Active' ? COLORS.tintSuccess :
                                   device.status === 'Warning' || device.status === 'Low Battery' ? COLORS.tintWarning :
                                   device.status === 'Critical' ? COLORS.tintCritical : COLORS.creamBg
                      }}>
                        <Wifi className="w-6 h-6" style={{ color: COLORS.textPrimary }} />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '2px' }}>
                            {device.name}
                          </div>
                          {device.hasAlert && device.alertIcon && (
                            <span style={{
                              fontSize: '14px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: accentColor,
                              color: 'white',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {device.alertIcon}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary }}>
                          {device.deviceId} {device.category === 'animal' && device.species && `• ${device.species}`}
                          {device.category === 'animal' && device.activity && ` • ${device.activity}`}
                          {device.category === 'animal' && device.speed > 0 && ` • ${device.speed.toFixed(1)} km/h`}
                          {device.category === 'ranger' && device.team && `• ${device.team}`}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      padding: '5px 12px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: statusBg,
                      color: statusColor
                    }}>
                      {device.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500, marginBottom: '4px' }}>
                        Signal Strength
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 600 }}>
                        {Math.round(device.signalStrength)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500, marginBottom: '4px' }}>
                        Last Ping
                      </div>
                      <div style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: 600 }}>
                        {formatTimeSince(device.lastPing)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#6B5E4F', fontWeight: 500 }}>
                        Battery
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B5E4F', fontWeight: 500 }}>
                        {Math.round(device.battery)}%
                      </div>
                    </div>
                    <div style={{
                      height: '6px',
                      background: COLORS.borderLight,
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${device.battery}%`,
                        background: batteryColor,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDevice(device);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: COLORS.burntOrange,
                        border: 'none',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('More options for', device.id);
                      }}
                      style={{
                        padding: '10px 14px',
                        background: 'transparent',
                        border: `1px solid ${COLORS.borderLight}`,
                        color: '#6B5E4F',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4CCBA'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E3D6'; }}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default LiveTracking;
