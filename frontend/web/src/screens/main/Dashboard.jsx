import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import MapComponent from '../../components/shared/MapComponent';
import { COLORS } from '../../constants/Colors';
import { auth } from '../../services';

const Dashboard = () => {
  const navigate = useNavigate();
  const [alertMessage, setAlertMessage] = useState('');

  // Removed live animals fetch - add back when dashboard displays this data

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

  const handleEmergency = () => {
    setAlertMessage('🚨 Emergency alert sent to all field teams!');
    setTimeout(() => setAlertMessage(''), 3000);
    // TODO: API call to trigger emergency protocol
  };

  const handleDeployTeam = () => {
    // Navigate to patrol operations for full deployment
    navigate('/patrol-operations');
  };

  // Incident data - will be replaced with real data
  const incidents = [
    { 
      id: 1, 
      type: 'Poaching Alert', 
      status: 'Responding',
      time: '23m ago',
      description: 'Suspicious vehicle spotted near elephant herd #12',
      location: 'Grid C4-7',
      rangers: 3,
      severity: 'critical'
    },
    { 
      id: 2, 
      type: 'Fence Breach', 
      status: 'Investigating',
      time: '1h ago',
      description: 'Perimeter fence damaged - possible entry point detected',
      location: 'Grid A2-3',
      rangers: 2,
      severity: 'high'
    },
    {
      id: 3,
      type: 'Device Offline',
      status: 'Monitoring',
      time: '2h ago',
      description: 'GPS tracker #23 lost signal in Sector B',
      location: 'Grid B5-2',
      rangers: 1,
      severity: 'medium'
    }
  ];

  // Patrol data
  const patrols = [
    {
      id: 1,
      name: 'Patrol Alpha',
      location: 'Northern Sector',
      rangers: 4,
      nextCheck: '30 min'
    },
    {
      id: 2,
      name: 'Patrol Bravo',
      location: 'Eastern Corridor',
      rangers: 3,
      nextCheck: '45 min'
    },
    {
      id: 3,
      name: 'Response Team',
      location: 'Command Center',
      rangers: 5,
      nextCheck: 'On call',
      inactive: true
    }
  ];

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div style={{ marginLeft: '260px', minHeight: '100vh' }}>
        {/* Hero Section */}
        <section style={{ 
          background: COLORS.forestGreen, 
          padding: '40px 40px 36px 40px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: COLORS.white, marginBottom: '10px', letterSpacing: '-0.8px' }}>
                Wildlife Conservation Operations
              </h1>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '14px', fontWeight: 500 }}>
                Real-time monitoring and protection of East African wildlife corridors
              </p>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                padding: '8px 16px', 
                borderRadius: '6px', 
                fontSize: '13px', 
                color: COLORS.white, 
                fontWeight: 600 
              }}>
                <MapPin className="w-4 h-4" />
                Kenya & Tanzania Wildlife Corridor
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '12px 20px', 
              borderRadius: '8px' 
            }}>
              <div style={{ width: '8px', height: '8px', background: COLORS.success, borderRadius: '50%' }}></div>
              <div style={{ color: COLORS.white, fontSize: '14px', fontWeight: 700 }}>System Online</div>
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
              <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px', color: COLORS.burntOrange }}>3</div>
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
              <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px', color: COLORS.forestGreen }}>12</div>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Rangers On Duty</div>
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
              <div style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px', color: COLORS.ochre }}>47</div>
              <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Tracked Animals</div>
                </div>
              </div>
        </section>

        {/* Content Section */}
        <section style={{ padding: '0 40px 40px 40px' }}>
          {/* Two Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Security Operations Card */}
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
                    background: COLORS.burntOrange, 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '18px' 
                  }}>
                    🛡️
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
                  }}>1 Critical</span>
                  <span style={{ 
                    padding: '5px 12px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    background: COLORS.forestGreen,
                    color: COLORS.white
                  }}>12 Rangers</span>
                </div>
              </div>

              {/* Severity Summary */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '2px', 
                background: COLORS.borderLight, 
                margin: '0 26px 22px 26px', 
                borderRadius: '8px', 
                overflow: 'hidden' 
              }}>
                <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.error }}>1</div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Critical</div>
                </div>
                <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.burntOrange }}>1</div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>High</div>
                </div>
                <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.ochre }}>1</div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Medium</div>
                </div>
                <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.textSecondary }}>3</div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total</div>
                </div>
              </div>

              {/* Incident List */}
              <div style={{ padding: '0 26px 26px 26px' }}>
                {incidents.map((incident) => {
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
                        <button style={{ 
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
                })}
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
                  View All Incidents →
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
              flexDirection: 'column'
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
                    justifyContent: 'center', 
                    fontSize: '18px' 
                  }}>
                    📍
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: COLORS.textPrimary }}>Corridor Overview</h3>
                    <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '3px' }}>Wildlife movement tracking</div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/operations/analytics')}
                  style={{ 
                    color: COLORS.burntOrange, 
                    background: 'transparent',
                    border: 'none',
                    textDecoration: 'none', 
                    fontSize: '13px', 
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.terracotta; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.burntOrange; }}
                >
                  Analytics →
                </button>
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
                    markers={[
                      { id: 1, position: [-1.4100, 35.0200], type: 'elephant', title: 'Maasai Mara Herd', description: 'Normal activity', color: '#10B981' },
                      { id: 2, position: [-2.3333, 34.8333], type: 'wildebeest', title: 'Serengeti Migration', description: 'Seasonal movement', color: '#E8961C' },
                      { id: 3, position: [-2.1540, 36.7073], type: 'alert', title: 'Poaching Alert', description: 'High risk area', color: '#EF4444' }
                    ]}
                  />
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '2px', 
                  background: COLORS.borderMedium, 
                  borderRadius: '8px', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.success }}>3</div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Normal</div>
                  </div>
                  <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.burntOrange }}>1</div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>High Activity</div>
                  </div>
                  <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.ochre }}>2</div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Seasonal</div>
                  </div>
                  <div style={{ background: COLORS.secondaryBg, padding: '18px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: COLORS.textSecondary }}>787</div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total</div>
                  </div>
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
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: COLORS.forestGreen, marginBottom: '5px' }}>
                      {patrol.rangers} Rangers
                    </div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>
                      Check: {patrol.nextCheck}
                    </div>
            </div>
          </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', padding: '0 26px 26px 26px' }}>
              <button 
                onClick={handleEmergency}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  background: COLORS.terracotta,
                  color: COLORS.white
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#A03A0C'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
              >
                🚨 Emergency
              </button>
              <button 
                onClick={handleDeployTeam}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  transition: 'all 0.2s', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  background: COLORS.burntOrange,
                  color: COLORS.white
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
              >
                📤 Deploy Team
              </button>
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
      `}</style>
    </div>
  );
};

export default Dashboard;
