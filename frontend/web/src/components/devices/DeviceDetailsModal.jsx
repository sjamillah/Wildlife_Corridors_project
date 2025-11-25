import React from 'react';
import { X, Wifi, Battery, Signal, MapPin, Clock, Activity, AlertTriangle, Navigation } from '@/components/shared/Icons';
import { COLORS } from '@/constants/Colors';

const DeviceDetailsModal = ({ device, onClose }) => {
  if (!device) return null;

  const getBatteryColor = (battery) => {
    if (battery > 70) return COLORS.success;
    if (battery > 30) return COLORS.ochre;
    return COLORS.error;
  };

  const formatTimeSince = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const batteryColor = getBatteryColor(device.battery);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          background: `linear-gradient(135deg, ${COLORS.forestGreen} 0%, ${COLORS.burntOrange} 100%)`,
          padding: '24px 32px',
          color: 'white',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <Wifi className="w-8 h-8" style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
                  {device.name}
                </h2>
                <p style={{ fontSize: '14px', opacity: 0.9, fontFamily: 'monospace' }}>
                  {device.deviceId}
                </p>
                {device.category === 'animal' && device.species && (
                  <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
                    {device.species}
                  </p>
                )}
                {device.category === 'ranger' && device.team && (
                  <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
                    Team: {device.team}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }}
            >
              <X className="w-6 h-6" style={{ color: 'white' }} />
            </button>
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.2)',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {device.status}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* Quick Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: COLORS.tintSuccess,
              border: `1px solid ${COLORS.success}20`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <Battery className="w-5 h-5" style={{ color: COLORS.success, margin: '0 auto 8px' }} />
              <div style={{ fontSize: '20px', fontWeight: 800, color: COLORS.success, marginBottom: '4px' }}>
                {Math.round(device.battery)}%
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }}>
                Battery
              </div>
            </div>

            <div style={{
              background: COLORS.tintInfo,
              border: `1px solid ${COLORS.info}20`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <Signal className="w-5 h-5" style={{ color: COLORS.info, margin: '0 auto 8px' }} />
              <div style={{ fontSize: '20px', fontWeight: 800, color: COLORS.info, marginBottom: '4px' }}>
                {Math.round(device.signalStrength)}%
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }}>
                Signal
              </div>
            </div>

            <div style={{
              background: COLORS.tintRangers,
              border: `1px solid ${COLORS.forestGreen}20`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <Clock className="w-5 h-5" style={{ color: COLORS.forestGreen, margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.forestGreen, marginBottom: '4px' }}>
                {formatTimeSince(device.lastPing)}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }}>
                Last Ping
              </div>
            </div>

            {device.category === 'animal' && device.speed !== undefined && (
              <div style={{
                background: COLORS.tintWarning,
                border: `1px solid ${COLORS.ochre}20`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <Activity className="w-5 h-5" style={{ color: COLORS.ochre, margin: '0 auto 8px' }} />
                <div style={{ fontSize: '20px', fontWeight: 800, color: COLORS.ochre, marginBottom: '4px' }}>
                  {device.speed?.toFixed(1) || '0.0'} km/h
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }}>
                  Speed
                </div>
              </div>
            )}
          </div>

          {/* Device Information */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* Basic Info */}
            <div style={{
              background: COLORS.whiteCard,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                color: COLORS.textPrimary, 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '16px'
              }}>
                Device Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Device Type:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                    {device.type || 'GPS Tracking Device'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Category:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, textTransform: 'capitalize' }}>
                    {device.category}
                  </span>
                </div>
                {device.category === 'animal' && device.activity && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Activity:</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, textTransform: 'capitalize' }}>
                      {device.activity === 'unknown' ? 'Not Available' : device.activity}
                    </span>
                  </div>
                )}
                {device.category === 'animal' && device.riskLevel && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Risk Level:</span>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      color: device.riskLevel === 'critical' || device.riskLevel === 'high' ? COLORS.error : COLORS.ochre,
                      textTransform: 'capitalize'
                    }}>
                      {device.riskLevel}
                    </span>
                  </div>
                )}
                {device.category === 'ranger' && device.team && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Team:</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                      {device.team}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Info */}
            <div style={{
              background: COLORS.whiteCard,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 700, 
                color: COLORS.textPrimary, 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '16px'
              }}>
                Location Data
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <MapPin className="w-4 h-4" style={{ color: COLORS.textSecondary, marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Current Location</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, fontFamily: 'monospace' }}>
                      {device.location || 'No GPS Data'}
                    </div>
                  </div>
                </div>
                {device.lat !== undefined && device.lon !== undefined && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Latitude:</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, fontFamily: 'monospace' }}>
                        {device.lat.toFixed(6)}°
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Longitude:</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, fontFamily: 'monospace' }}>
                        {device.lon.toFixed(6)}°
                      </span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Last Update:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                    {formatTimeSince(device.lastPing)}
                  </span>
                </div>
                {device.category === 'animal' && device.pathColor && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: COLORS.textSecondary }}>Path Color:</span>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: device.pathColor,
                      border: `1px solid ${COLORS.borderLight}`
                    }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Battery & Signal Details */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* Battery */}
            <div style={{
              background: COLORS.whiteCard,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Battery className="w-5 h-5" style={{ color: batteryColor }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: COLORS.textPrimary }}>Battery Level</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: batteryColor }}>
                  {Math.round(device.battery)}%
                </span>
              </div>
              <div style={{
                height: '8px',
                background: COLORS.borderLight,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${device.battery}%`,
                  background: batteryColor,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              {device.battery < 30 && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  background: COLORS.tintWarning,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: COLORS.ochre }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.ochre }}>
                    Low battery - consider replacing soon
                  </span>
                </div>
              )}
            </div>

            {/* Signal Strength */}
            <div style={{
              background: COLORS.whiteCard,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Signal className="w-5 h-5" style={{ color: device.signalStrength > 50 ? COLORS.success : COLORS.ochre }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: COLORS.textPrimary }}>Signal Strength</span>
                </div>
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 800, 
                  color: device.signalStrength > 50 ? COLORS.success : COLORS.ochre
                }}>
                  {Math.round(device.signalStrength)}%
                </span>
              </div>
              <div style={{
                height: '8px',
                background: COLORS.borderLight,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${device.signalStrength}%`,
                  background: device.signalStrength > 50 ? COLORS.success : COLORS.ochre,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              {device.signalStrength < 50 && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  background: COLORS.tintWarning,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle className="w-4 h-4" style={{ color: COLORS.ochre }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: COLORS.ochre }}>
                    Weak signal - device may have connectivity issues
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Alerts Section */}
          {device.hasAlert && (
            <div style={{
              background: COLORS.tintCritical,
              border: `1px solid ${COLORS.error}30`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.error, marginBottom: '4px' }}>
                  Active Alert
                </div>
                <div style={{ fontSize: '13px', color: COLORS.textSecondary }}>
                  This device has an active alert. Check the alerts section for more details.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                if (device.category === 'animal') {
                  window.open(`/tracking?animal=${device.id.replace('animal-', '')}`, '_blank');
                } else if (device.category === 'ranger') {
                  window.open(`/team?ranger=${device.id.replace('ranger-', '')}`, '_blank');
                }
              }}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: COLORS.burntOrange,
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
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
              <Navigation className="w-4 h-4" />
              View on Map
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: `1px solid ${COLORS.borderLight}`,
                color: COLORS.textPrimary,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.borderColor = COLORS.borderMedium;
                e.currentTarget.style.background = COLORS.creamBg;
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.borderColor = COLORS.borderLight;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailsModal;

