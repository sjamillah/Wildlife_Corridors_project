import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Wifi, Settings } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { COLORS, rgba } from '../../constants/Colors';

const LiveTracking = () => {
  const navigate = useNavigate();
  
  const [, setSelectedDevice] = useState(null);
  const [devices, setDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    navigate('/auth');
  };

  useEffect(() => {
    // Mock data for tracking devices - Animals and Rangers
    const mockDevices = [
      // Animal devices
      {
        id: 'WC-001',
        name: 'Elephant #001',
        deviceId: 'WC-001',
        status: 'Active',
        battery: 78,
        signalStrength: 85,
        lastPing: Date.now() - 300000, // 5 minutes ago
        location: 'Northern Reserve, Zone A',
        type: 'GPS Collar',
        category: 'animal',
        species: 'Elephant'
      },
      {
        id: 'WC-002',
        name: 'Wildebeest #002',
        deviceId: 'WC-002',
        status: 'Active',
        battery: 92,
        signalStrength: 72,
        lastPing: Date.now() - 120000, // 2 minutes ago
        location: 'Eastern Ridge Trail',
        type: 'Satellite Collar',
        category: 'animal',
        species: 'Wildebeest'
      },
      {
        id: 'WC-003',
        name: 'Zebra #003',
        deviceId: 'WC-003',
        status: 'Critical',
        battery: 23,
        signalStrength: 41,
        lastPing: Date.now() - 900000, // 15 minutes ago
        location: 'Southern Valley',
        type: 'GPS Collar',
        category: 'animal',
        species: 'Zebra'
      },
      {
        id: 'WC-004',
        name: 'Elephant #004',
        deviceId: 'WC-004',
        status: 'Low Battery',
        battery: 15,
        signalStrength: 38,
        lastPing: Date.now() - 1800000, // 30 minutes ago
        location: 'Western Forest Edge',
        type: 'Light Collar',
        category: 'animal',
        species: 'Elephant'
      },
      {
        id: 'WC-005',
        name: 'Lion #005',
        deviceId: 'WC-005',
        status: 'Offline',
        battery: 0,
        signalStrength: 0,
        lastPing: Date.now() - 3600000, // 1 hour ago
        location: 'Unknown',
        type: 'GPS Collar',
        category: 'animal',
        species: 'Lion'
      },
      // Ranger devices
      {
        id: 'RG-001',
        name: 'Ranger Team Alpha',
        deviceId: 'RG-001',
        status: 'Active',
        battery: 95,
        signalStrength: 92,
        lastPing: Date.now() - 60000, // 1 minute ago
        location: 'Northern Sector Patrol',
        type: 'Ranger Device',
        category: 'ranger',
        team: 'Alpha Team'
      },
      {
        id: 'RG-002',
        name: 'Ranger Team Bravo',
        deviceId: 'RG-002',
        status: 'Active',
        battery: 88,
        signalStrength: 78,
        lastPing: Date.now() - 180000, // 3 minutes ago
        location: 'Eastern Corridor',
        type: 'Ranger Device',
        category: 'ranger',
        team: 'Bravo Team'
      },
      {
        id: 'RG-003',
        name: 'Ranger Team Charlie',
        deviceId: 'RG-003',
        status: 'Offline',
        battery: 45,
        signalStrength: 0,
        lastPing: Date.now() - 7200000, // 2 hours ago
        location: 'Last seen: Command Center',
        type: 'Ranger Device',
        category: 'ranger',
        team: 'Charlie Team'
      },
      {
        id: 'RG-004',
        name: 'Ranger Team Delta',
        deviceId: 'RG-004',
        status: 'Active',
        battery: 72,
        signalStrength: 65,
        lastPing: Date.now() - 240000, // 4 minutes ago
        location: 'Southern Valley Patrol',
        type: 'Ranger Device',
        category: 'ranger',
        team: 'Delta Team'
      }
    ];

    setDevices(mockDevices);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setDevices(prevDevices => 
        prevDevices.map(device => {
          const batteryDelta = Math.random() * 2 - 1;
          const signalDelta = Math.random() * 10 - 5;
          
          return {
            ...device,
            battery: Math.max(0, Math.min(100, device.battery + batteryDelta)),
            signalStrength: Math.max(0, Math.min(100, device.signalStrength + signalDelta)),
            lastPing: Math.random() > 0.7 ? Date.now() : device.lastPing
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeSince = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  // Calculate stats
  const totalDevices = devices.length;
  const activeDevices = devices.filter(d => d.status === 'Active').length;
  const lowBatteryDevices = devices.filter(d => d.battery < 30).length;
  const weakSignalDevices = devices.filter(d => d.signalStrength < 50).length;
  const offlineDevices = devices.filter(d => d.status === 'Offline').length;

  // Filter devices
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
      
      {/* Main Content */}
      <div style={{ marginLeft: '260px', minHeight: '100vh' }}>
        {/* Page Header */}
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
            {/* Live indicator */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.success, animation: 'pulse 2s ease-in-out infinite' }}></div>
              Live
            </div>
            {/* Filters button */}
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
            {/* Add Device button */}
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

        {/* Status Overview Bar */}
        <section style={{ background: COLORS.secondaryBg, padding: '20px 40px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <div style={{ display: 'flex', gap: '2px', background: COLORS.borderLight, borderRadius: '8px', overflow: 'hidden', height: '70px' }}>
            {/* Total */}
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

            {/* Active */}
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

            {/* Battery Low */}
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

            {/* Signal Weak */}
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

            {/* Offline */}
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

        {/* Devices Section */}
        <section style={{ padding: '32px 40px' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary }}>Devices</h2>
            {/* Search and Filters Row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, maxWidth: '600px', marginLeft: 'auto' }}>
              {/* Search Box */}
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
              {/* Filter Tabs */}
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

          {/* Device Cards Grid */}
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
                  {/* Top Accent Bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    borderRadius: '10px 10px 0 0',
                    background: accentColor
                  }}></div>

                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    {/* Device Info */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      {/* Icon */}
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
                      {/* Name and ID */}
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '2px' }}>
                          {device.name}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary }}>
                          {device.deviceId} {device.category === 'animal' && device.species && `• ${device.species}`}
                          {device.category === 'ranger' && device.team && `• ${device.team}`}
                        </div>
                      </div>
                    </div>
                    {/* Status Badge */}
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

                  {/* Card Metrics */}
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

                  {/* Battery Section */}
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

                  {/* Card Footer */}
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

      {/* Add pulse animation CSS */}
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
