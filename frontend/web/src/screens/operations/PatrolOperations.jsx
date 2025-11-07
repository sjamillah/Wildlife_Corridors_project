import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Clock, Route, CheckCircle, AlertTriangle, Search, Navigation, X, Play, Square } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { BRAND_COLORS, COLORS, rgba } from '../../constants/Colors';
import { auth } from '../../services';

const PatrolOperations = () => {
  const [selectedPatrol, setSelectedPatrol] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const [showPatrolDetails, setShowPatrolDetails] = useState(false);
  const [trackingPatrols, setTrackingPatrols] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const [patrols] = useState([
    {
      id: 'PTRL-001',
      name: 'Tsavo East Perimeter',
      status: 'active',
      priority: 'high',
      team: 'KWS Unit Alpha',
      leader: 'Senior Warden Kamau',
      members: ['J. Kamau', 'M. Wanjiku', 'P. Mwangi', 'S. Achieng'],
      startTime: '06:00',
      expectedDuration: '8 hours',
      currentLocation: 'Voi Gate Section',
      route: 'Voi Gate → Aruba Dam → Mudanda Rock',
      objectives: ['Perimeter Check', 'Anti-Poaching', 'Wildlife Count'],
      equipment: ['GPS Units', 'Radios', 'First Aid', 'Camera Traps'],
      progress: 45,
      lastUpdate: '2 min ago',
      coordinates: [34.8532, -2.0891],
      incidents: 1,
      icon: '🚶‍♂️'
    },
    {
      id: 'PTRL-002',
      name: 'Village Outreach Program',
      status: 'scheduled',
      priority: 'medium',
      team: 'Beta Team',
      leader: 'Sarah Muthoni',
      members: ['S. Muthoni', 'D. Kipchoge', 'L. Wambui'],
      startTime: '09:00',
      expectedDuration: '6 hours',
      currentLocation: 'Base Station',
      route: 'Village A → School → Community Center → Village B',
      objectives: ['Education', 'Conflict Mitigation', 'Data Collection'],
      equipment: ['Educational Materials', 'Survey Forms', 'Gifts'],
      progress: 0,
      lastUpdate: '1 hour ago',
      coordinates: [34.7821, -2.1245],
      incidents: 0,
      icon: '🏫'
    },
    {
      id: 'PTRL-003',
      name: 'Emergency Response - Elephant',
      status: 'active',
      priority: 'critical',
      team: 'Charlie Team',
      leader: 'Michael Ochieng',
      members: ['M. Ochieng', 'A. Njeru', 'F. Wanjala', 'G. Kiprotich'],
      startTime: '14:30',
      expectedDuration: '4 hours',
      currentLocation: 'Village X Outskirts',
      route: 'Emergency Response → Herd Location → Safe Corridor',
      objectives: ['Animal Relocation', 'Public Safety', 'Damage Assessment'],
      equipment: ['Deterrent Equipment', 'Emergency Kit', 'Communication Gear'],
      progress: 75,
      lastUpdate: '5 min ago',
      coordinates: [34.8901, -2.0672],
      incidents: 2,
      icon: 'AlertTriangle'
    },
    {
      id: 'PTRL-004',
      name: 'Camera Trap Maintenance',
      status: 'completed',
      priority: 'low',
      team: 'Delta Team',
      leader: 'Grace Njoki',
      members: ['G. Njoki', 'T. Mutua'],
      startTime: '07:00',
      expectedDuration: '5 hours',
      currentLocation: 'Base Station',
      route: 'Trap Site 1 → Trap Site 2 → Trap Site 3',
      objectives: ['Equipment Check', 'Data Download', 'Battery Replacement'],
      equipment: ['Tools', 'Batteries', 'SD Cards', 'Cleaning Kit'],
      progress: 100,
      lastUpdate: '2 hours ago',
      coordinates: [34.8234, -2.1089],
      incidents: 0,
      icon: '📷'
    },
    {
      id: 'PTRL-005',
      name: 'Night Surveillance',
      status: 'scheduled',
      priority: 'high',
      team: 'Echo Team',
      leader: 'Robert Maina',
      members: ['R. Maina', 'C. Wafula', 'J. Kibet'],
      startTime: '20:00',
      expectedDuration: '10 hours',
      currentLocation: 'Base Station',
      route: 'Hot Spot Alpha → Hot Spot Beta → Hot Spot Gamma',
      objectives: ['Anti-Poaching', 'Night Movement Monitoring', 'Deterrent Patrol'],
      equipment: ['Night Vision', 'Thermal Cameras', 'Silent Radios', 'Emergency Flares'],
      progress: 0,
      lastUpdate: '30 min ago',
      coordinates: [34.7956, -2.0934],
      incidents: 0,
      icon: '🌙'
    }
  ]);

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      navigate('/auth', { replace: true });
    }
  };

  const handleTrackPatrol = (patrol, e) => {
    e.stopPropagation();
    if (trackingPatrols[patrol.id]) {
      setTrackingPatrols(prev => ({ ...prev, [patrol.id]: false }));
      console.log('Stopped tracking patrol:', patrol.id);
    } else {
      setTrackingPatrols(prev => ({ ...prev, [patrol.id]: true }));
      console.log('Started tracking patrol:', patrol.id);
    }
  };

  const handlePatrolDetails = (patrol, e) => {
    e.stopPropagation();
    setSelectedPatrol(patrol);
    setShowPatrolDetails(true);
  };

  const filteredPatrols = patrols.filter(patrol => {
    const matchesSearch = patrol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patrol.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patrol.team.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = viewMode === 'all' || patrol.status === viewMode;
    
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: patrols.length,
    active: patrols.filter(p => p.status === 'active').length,
    scheduled: patrols.filter(p => p.status === 'scheduled').length,
    completed: patrols.filter(p => p.status === 'completed').length
  };

  const priorityCounts = {
    critical: patrols.filter(p => p.priority === 'critical').length,
    high: patrols.filter(p => p.priority === 'high').length,
    medium: patrols.filter(p => p.priority === 'medium').length,
    low: patrols.filter(p => p.priority === 'low').length
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div style={{ marginLeft: '260px', minHeight: '100vh' }}>
        {/* Page Header */}
        <section style={{ background: COLORS.forestGreen, padding: '28px 40px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: COLORS.white, marginBottom: '6px', letterSpacing: '-0.6px' }}>
              Patrol Operations
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Coordinate field teams and missions
            </p>
            </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Team count */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: COLORS.white, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users className="w-4 h-4" />
              Teams: {patrols.length}
                </div>
            {/* Critical badge */}
            <div style={{ background: COLORS.error, padding: '8px 16px', borderRadius: '6px', color: COLORS.white, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle className="w-4 h-4" />
              Critical: {priorityCounts.critical}
                </div>
            </div>
        </section>

        {/* Status Overview Bar */}
        <section style={{ background: COLORS.secondaryBg, padding: '20px 40px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <div style={{ display: 'flex', gap: '2px', background: COLORS.borderLight, borderRadius: '8px', overflow: 'hidden', height: '70px' }}>
            {/* Active Patrols */}
            <div style={{
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
            onClick={() => setViewMode('active')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.forestGreen, marginBottom: '4px' }}>
                {statusCounts.active}
                </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Active Patrols
                </div>
              </div>

            {/* Scheduled Today */}
            <div style={{
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
            onClick={() => setViewMode('scheduled')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.info, marginBottom: '4px' }}>
                {statusCounts.scheduled}
            </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Scheduled Today
                </div>
                </div>

            {/* Critical Missions */}
            <div style={{
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
                {priorityCounts.critical}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Critical Missions
            </div>
                </div>

            {/* Completed Today */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.tintSuccess,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => setViewMode('completed')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.success, marginBottom: '4px' }}>
                {statusCounts.completed}
                </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Completed Today
              </div>
            </div>
                </div>
        </section>

        {/* Patrols Section */}
        <section style={{ padding: '32px 40px' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary }}>Patrols</h2>
            {/* Search Filter Row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, maxWidth: '600px', marginLeft: 'auto' }}>
              {/* Search Box */}
              <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSecondary }} />
                  <input
                    type="text"
                    placeholder="Search missions, teams, objectives..."
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
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'active', 'scheduled', 'completed'].map((filter) => {
                  const isActive = viewMode === filter;
                  const label = filter === 'all' ? 'All' :
                               filter === 'active' ? 'Active' :
                               filter === 'scheduled' ? 'Scheduled' : 'Completed';

                  return (
                    <button
                      key={filter}
                      onClick={() => setViewMode(filter)}
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

          {/* Patrol Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: '24px' }}>
            {filteredPatrols.map((patrol) => {
              const accentColor = patrol.priority === 'critical' ? COLORS.error :
                                 patrol.priority === 'high' ? COLORS.ochre : COLORS.forestGreen;

              return (
                <div
                  key={patrol.id}
                  onClick={() => setSelectedPatrol(patrol)}
                  style={{
                    background: COLORS.whiteCard,
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: '10px',
                    padding: '24px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderMedium;
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Top Accent */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    {/* Patrol Title Section */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      {/* Icon */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        background: patrol.priority === 'critical' ? COLORS.tintCritical : COLORS.tintRangers
                      }}>
                        <Navigation className="w-6 h-6" style={{ color: COLORS.textPrimary }} />
                        </div>
                      {/* Title info */}
                        <div>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '4px' }}>
                          {patrol.name}
                        </div>
                        <div style={{ fontSize: '12px', color: COLORS.textSecondary, fontWeight: 500 }}>
                          {patrol.id}
                      </div>
                      </div>
                    </div>
                    {/* Card Badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      {/* Status */}
                      <span style={{
                        padding: '5px 12px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: patrol.status === 'active' ? COLORS.tintRangers :
                                   patrol.status === 'scheduled' ? rgba('statusInfo', 0.1) : COLORS.tintSuccess,
                        color: patrol.status === 'active' ? COLORS.forestGreen :
                              patrol.status === 'scheduled' ? COLORS.info : COLORS.success
                      }}>
                        {patrol.status}
                        </span>
                      {/* Priority */}
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: patrol.priority === 'critical' ? COLORS.error :
                                   patrol.priority === 'high' ? COLORS.ochre :
                                   patrol.priority === 'medium' ? COLORS.info : COLORS.textSecondary,
                        color: COLORS.white
                      }}>
                        {patrol.priority}
                        </span>
                      </div>
                    </div>

                  {/* Card Details */}
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: BRAND_COLORS.TEXT_TERTIARY }}>
                      <Users className="w-4 h-4" style={{ width: '20px', color: COLORS.textSecondary }} />
                      <span style={{ fontWeight: 500 }}>{patrol.team} - {patrol.leader}</span>
                        </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: BRAND_COLORS.TEXT_TERTIARY }}>
                      <MapPin className="w-4 h-4" style={{ width: '20px', color: COLORS.textSecondary }} />
                      <span style={{ fontWeight: 500 }}>{patrol.currentLocation}</span>
                      </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: BRAND_COLORS.TEXT_TERTIARY }}>
                      <Clock className="w-4 h-4" style={{ width: '20px', color: COLORS.textSecondary }} />
                      <span style={{ fontWeight: 500 }}>{patrol.startTime} • {patrol.expectedDuration}</span>
                      </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#4A4235' }}>
                      <Route className="w-4 h-4" style={{ width: '20px', color: '#6B5E4F' }} />
                      <span style={{ fontWeight: 500 }}>{patrol.route}</span>
                    </div>
                      </div>
                      
                  {/* Team Avatars */}
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${COLORS.creamBg}` }}>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      Team
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {patrol.members.slice(0, 5).map((member, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            marginLeft: idx === 0 ? 0 : '-8px',
                            background: idx === 0 ? COLORS.burntOrange :
                                       idx === 1 ? COLORS.forestGreen :
                                       idx === 2 ? COLORS.ochre :
                                       idx === 3 ? COLORS.info : COLORS.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {member.charAt(0)}
                        </div>
                      ))}
                      </div>
                    </div>

                  {/* Progress Section */}
                    {patrol.status === 'active' && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Progress
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPrimary }}>
                          {patrol.progress}%
                        </div>
                      </div>
                      <div style={{ height: '8px', background: '#E8E3D6', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${patrol.progress}%`,
                          background: patrol.priority === 'critical' ? '#EF4444' : '#2E5D45',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }}></div>
                        </div>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#6B5E4F', marginTop: '10px' }}>
                        {patrol.objectives.map((obj, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle className="w-3 h-3" style={{ color: '#10B981' }} />
                            {obj}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button 
                        onClick={(e) => handleTrackPatrol(patrol, e)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#D84315',
                        border: 'none',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#BF3812'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#D84315'; }}
                      >
                        {trackingPatrols[patrol.id] ? (
                          <>
                            <Square className="w-4 h-4" />
                            Stop Tracking
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                          Track
                          </>
                        )}
                      </button>
                      <button 
                        onClick={(e) => handlePatrolDetails(patrol, e)}
                      style={{
                        padding: '12px 18px',
                        background: 'transparent',
                        border: `1px solid ${COLORS.borderLight}`,
                        color: '#6B5E4F',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#2E5D45';
                        e.currentTarget.style.color = '#2E5D45';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = COLORS.borderLight;
                        e.currentTarget.style.color = '#6B5E4F';
                      }}
                    >
                        Details
                      </button>
                    </div>
                  {/* Time Badge */}
                  <div style={{ fontSize: '11px', color: '#6B5E4F', fontWeight: 500, marginTop: '8px', textAlign: 'right' }}>
                    Updated {patrol.lastUpdate}
                  </div>
                </div>
              );
            })}
            </div>
        </section>
      </div>

      {/* Patrol Details Modal - Functionality preserved */}
      {showPatrolDetails && selectedPatrol && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '12px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#2E5D45', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{selectedPatrol.name}</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{selectedPatrol.id} • {selectedPatrol.team}</p>
              </div>
              <button onClick={() => setShowPatrolDetails(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#EDF5F0', color: '#2E5D45' }}>
                    {selectedPatrol.status}
                  </span>
                  <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: selectedPatrol.priority === 'critical' ? '#FEF3F2' : '#FEF9E7', color: selectedPatrol.priority === 'critical' ? '#EF4444' : '#E8961C' }}>
                    {selectedPatrol.priority}
                  </span>
                </div>
                {selectedPatrol.status === 'active' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>Progress</span>
                      <span style={{ fontWeight: 700 }}>{selectedPatrol.progress}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#E8E3D6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${selectedPatrol.progress}%`, background: '#2E5D45', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B5E4F', marginBottom: '8px' }}>Team Leader</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPatrol.leader}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B5E4F', marginBottom: '8px' }}>Location</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPatrol.currentLocation}</div>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B5E4F', marginBottom: '8px' }}>Objectives</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPatrol.objectives.map((obj, idx) => (
                    <div key={idx} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />
                      {obj}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #E8E3D6', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button
                onClick={() => setShowPatrolDetails(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid #E8E3D6',
                  borderRadius: '6px',
                  color: '#6B5E4F',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4CCBA'; e.currentTarget.style.background = '#FAFAF8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E3D6'; e.currentTarget.style.background = 'transparent'; }}
              >
                Close
              </button>
              <button
                onClick={(e) => handleTrackPatrol(selectedPatrol, e)}
                style={{
                  padding: '10px 20px',
                  background: trackingPatrols[selectedPatrol.id] ? '#EF4444' : '#D84315',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = trackingPatrols[selectedPatrol.id] ? '#DC2626' : '#BF3812'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = trackingPatrols[selectedPatrol.id] ? '#EF4444' : '#D84315'; }}
              >
                {trackingPatrols[selectedPatrol.id] ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop Tracking
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Tracking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatrolOperations;
