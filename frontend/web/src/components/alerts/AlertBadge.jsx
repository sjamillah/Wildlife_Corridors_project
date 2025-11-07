import React from 'react';
import { Bell, AlertTriangle } from '@/components/shared/Icons';
import { COLORS } from '@/constants/Colors';

const AlertBadge = ({ stats, onClick }) => {
  if (!stats || (stats.active === 0 && stats.critical === 0)) return null;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        background: stats.critical > 0 ? COLORS.error : COLORS.ochre,
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        fontWeight: 600,
        transition: 'all 0.2s',
        boxShadow: stats.critical > 0 ? '0 2px 8px rgba(220, 38, 38, 0.4)' : '0 2px 8px rgba(234, 88, 12, 0.4)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {stats.critical > 0 ? (
        <AlertTriangle style={{ width: 16, height: 16 }} />
      ) : (
        <Bell style={{ width: 16, height: 16 }} />
      )}
      
      {stats.critical > 0 && (
        <span style={{ animation: 'pulse 2s infinite' }}>
          {stats.critical} Critical
        </span>
      )}
      
      {stats.critical === 0 && stats.active > 0 && (
        <span>{stats.active} Active</span>
      )}
      
      {stats.critical > 0 && (
        <div style={{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'white',
          border: `2px solid ${COLORS.error}`,
          animation: 'pulse 1s infinite'
        }} />
      )}
    </button>
  );
};

export default AlertBadge;

