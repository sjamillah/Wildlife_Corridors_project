import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wifi, AlertTriangle, Activity, TrendingUp, Settings, LogOut } from '@/components/shared/Icons';
import { COLORS } from '../../constants/Colors';
import { auth } from '../../services';
const AureynxLogo = '/assets/Aureynx_Logo.webp';

const Sidebar = ({ sidebarOpen = true, setSidebarOpen, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState({
    name: 'User',
    email: '',
    role: 'Manager',
    initials: 'U'
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await auth.getProfile();
        const name = profile.name || profile.email?.split('@')[0] || 'User';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        setUserProfile({
          name: name,
          email: profile.email,
          role: profile.role === 'ranger' ? 'Field Ranger' : 'Conservation Manager',
          initials: initials
        });
      } catch (error) {
        console.log('Using cached profile');
      }
    };

    loadProfile();
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '260px',
      height: '100vh',
      background: COLORS.beigeSidebar,
      borderRight: `2px solid ${COLORS.borderMedium}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      {/* Sidebar Header */}
      <div style={{ padding: '28px 24px', borderBottom: `2px solid ${COLORS.borderMedium}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src={AureynxLogo} 
            alt="Aureynx Logo" 
            style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '17px', color: COLORS.textPrimary, letterSpacing: '-0.3px' }}>Aureynx</span>
            <span style={{ fontSize: '11px', color: COLORS.textSecondary, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Wildlife Protection</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
        {[
          { icon: Home, label: 'Dashboard', route: '/dashboard' },
          { icon: Wifi, label: 'Live Devices', route: '/tracking' },
          { icon: Activity, label: 'Wildlife', route: '/wildlife-tracking' },
          { icon: AlertTriangle, label: 'Alerts', route: '/alerts' },
          { icon: TrendingUp, label: 'Analytics', route: '/analytics' },
          { icon: Settings, label: 'Settings', route: '/settings' }
        ].map((item, idx) => {
          const isActive = location.pathname === item.route;
          return (
            <button
              key={idx}
              onClick={() => {
                if (item.route) {
                  navigate(item.route);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                background: isActive ? `rgba(216, 67, 21, 0.85)` : 'transparent',
                color: isActive ? COLORS.white : COLORS.textSecondary,
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = COLORS.borderMedium;
                  e.currentTarget.style.color = COLORS.burntOrange;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = COLORS.textSecondary;
                }
              }}
            >
              <item.icon style={{ marginRight: '12px', fontSize: '18px' }} />
              {item.label}
              {item.badge && (
                <span style={{
                  marginLeft: 'auto',
                  background: COLORS.terracotta,
                  color: COLORS.white,
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '10px',
                  minWidth: '22px',
                  textAlign: 'center'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer - User Profile & Logout */}
      <div style={{ padding: '20px', borderTop: `2px solid ${COLORS.borderMedium}` }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          background: COLORS.borderMedium,
          borderRadius: '10px',
          marginBottom: '12px'
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '42px',
              height: '42px',
              background: COLORS.burntOrange,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.white,
              fontWeight: 700,
              fontSize: '15px'
            }}>
              {userProfile.initials}
            </div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '12px',
              height: '12px',
              background: COLORS.success,
              border: `2px solid ${COLORS.borderMedium}`,
              borderRadius: '50%'
            }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: '14px', color: COLORS.textPrimary }}>{userProfile.name}</p>
            <p style={{ fontSize: '12px', color: COLORS.textSecondary }}>{userProfile.role}</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
            background: 'transparent',
            border: `2px solid ${COLORS.borderMedium}`,
            color: COLORS.textSecondary,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.error;
            e.currentTarget.style.borderColor = COLORS.error;
            e.currentTarget.style.color = COLORS.white;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = COLORS.borderMedium;
            e.currentTarget.style.color = COLORS.textSecondary;
          }}
        >
          <LogOut style={{ fontSize: '16px' }} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;