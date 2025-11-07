import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Clock } from '@/components/shared/Icons';
import { COLORS } from '@/constants/Colors';
import { alerts as alertsService } from '@/services';

const AlertsPanel = ({ onClose }) => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const data = await alertsService.getActive();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await alertsService.acknowledge(alertId, 'Acknowledged by ranger');
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolve = async (alertId) => {
    const notes = prompt('Enter resolution notes:');
    if (!notes) return;
    
    try {
      await alertsService.resolve(alertId, notes);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return COLORS.error;
      case 'high': return COLORS.ochre;
      case 'medium': return COLORS.info;
      default: return COLORS.textSecondary;
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return COLORS.tintCritical;
      case 'high': return COLORS.tintWarning;
      case 'medium': return COLORS.tintInfo;
      default: return COLORS.secondaryBg;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '450px',
      background: COLORS.whiteCard,
      boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: `2px solid ${COLORS.borderLight}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: COLORS.forestGreen
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            Wildlife Alerts
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
            {alerts.length} active alerts
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X style={{ width: 24, height: 24 }} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textSecondary }}>
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircle style={{ width: 48, height: 48, margin: '0 auto 16px' }} color={COLORS.success} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '8px' }}>
              No Active Alerts
            </div>
            <div style={{ fontSize: '13px', color: COLORS.textSecondary }}>
              All animals are safe
            </div>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                background: getSeverityBg(alert.severity),
                border: `2px solid ${getSeverityColor(alert.severity)}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: getSeverityColor(alert.severity),
                  background: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  {alert.alert_type}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: getSeverityColor(alert.severity)
                }}>
                  {alert.severity}
                </span>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '8px' }}>
                {alert.title}
              </h4>
              
              <p style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '12px', lineHeight: '1.5' }}>
                {alert.message}
              </p>

              <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '12px' }}>
                <div>Animal: <strong>{alert.animal_name}</strong> ({alert.animal_species})</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Clock style={{ width: 12, height: 12 }} />
                  {new Date(alert.detected_at).toLocaleString()}
                </div>
              </div>

              {alert.status === 'active' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: COLORS.info,
                      border: 'none',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: COLORS.success,
                      border: 'none',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Resolve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;

