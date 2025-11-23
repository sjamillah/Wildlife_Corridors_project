import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wifi, AlertTriangle, Activity, TrendingUp, Settings, LogOut, Shield, Menu, X, ChevronLeft, ChevronRight } from '@/components/shared/Icons';
import { COLORS } from '../../constants/Colors';
import { auth } from '../../services';
const AureynxLogo = '/assets/Aureynx_Logo.webp';

// Close dropdown when clicking outside
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
};

const Sidebar = ({ sidebarOpen = true, setSidebarOpen, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  const [userProfile, setUserProfile] = useState({
    name: 'User',
    email: '',
    role: 'Manager',
    initials: 'U'
  });

  // Close dropdown when clicking outside
  useClickOutside(profileDropdownRef, () => {
    setShowProfileDropdown(false);
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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (route) => {
    if (route) {
      navigate(route);
      if (isMobile) {
        closeMobileMenu();
      }
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (setSidebarOpen) {
      setSidebarOpen(!isCollapsed);
    }
  };
  
  return (
    <>
      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 101,
            background: COLORS.forestGreen,
            color: COLORS.white,
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: isCollapsed ? '80px' : '260px',
        height: '100vh',
        background: COLORS.beigeSidebar,
        borderRight: `2px solid ${COLORS.borderMedium}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'all 0.3s ease'
      }}>
      {/* Sidebar Header */}
      <div style={{ 
        padding: isCollapsed ? '20px' : '28px 24px', 
        borderBottom: `2px solid ${COLORS.borderMedium}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '14px', flex: isCollapsed ? 'none' : '1' }}>
          <img 
            src={AureynxLogo} 
            alt="Aureynx Logo" 
            style={{ 
              width: isCollapsed ? '60px' : '44px', 
              height: isCollapsed ? '60px' : '44px', 
              borderRadius: '10px', 
              objectFit: 'contain',
              transition: 'all 0.3s ease'
            }}
          />
          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: '17px', color: COLORS.textPrimary, letterSpacing: '-0.3px' }}>Aureynx</span>
              <span style={{ fontSize: '11px', color: COLORS.textSecondary, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>Wildlife Protection</span>
            </div>
          )}
        </div>
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: COLORS.textSecondary,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.borderMedium;
              e.currentTarget.style.color = COLORS.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = COLORS.textSecondary;
            }}
          >
            {isCollapsed ? <ChevronRight style={{ fontSize: '20px' }} /> : <ChevronLeft style={{ fontSize: '20px' }} />}
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
        {[
          { icon: Home, label: 'Dashboard', route: '/dashboard' },
          { icon: Wifi, label: 'Live Devices', route: '/tracking' },
          { icon: Activity, label: 'Wildlife', route: '/wildlife-tracking' },
          { icon: AlertTriangle, label: 'Alerts', route: '/alerts' },
          { icon: Shield, label: 'Patrol Operations', route: '/patrol-operations' },
          { icon: TrendingUp, label: 'Analytics', route: '/analytics' },
          { icon: Settings, label: 'Settings', route: '/settings' }
        ].map((item, idx) => {
          const isActive = location.pathname === item.route;
          return (
            <button
              key={idx}
              onClick={() => handleNavClick(item.route)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '16px' : '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                background: isActive ? `rgba(216, 67, 21, 0.85)` : 'transparent',
                color: isActive ? COLORS.white : COLORS.textSecondary,
                border: 'none',
                cursor: 'pointer',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = COLORS.borderMedium;
                  e.currentTarget.style.color = COLORS.burntOrange;
                }
                // Show tooltip when collapsed
                if (isCollapsed) {
                  const tooltip = document.createElement('div');
                  tooltip.textContent = item.label;
                  tooltip.style.cssText = `
                    position: absolute;
                    left: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    margin-left: 10px;
                    background: ${COLORS.textPrimary};
                    color: ${COLORS.white};
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    white-space: nowrap;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    pointer-events: none;
                  `;
                  e.currentTarget.appendChild(tooltip);
                  e.currentTarget.dataset.tooltip = tooltip;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = COLORS.textSecondary;
                }
                // Remove tooltip
                const tooltip = e.currentTarget.dataset.tooltip;
                if (tooltip) {
                  const tooltipEl = e.currentTarget.querySelector('div');
                  if (tooltipEl) tooltipEl.remove();
                  delete e.currentTarget.dataset.tooltip;
                }
              }}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon style={{ fontSize: '18px', marginRight: isCollapsed ? '0' : '12px' }} />
              {!isCollapsed && (
                <>
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
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer - User Profile with Dropdown */}
      <div style={{ padding: '20px', borderTop: `2px solid ${COLORS.borderMedium}` }}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isCollapsed ? '0' : '12px',
            padding: isCollapsed ? '8px' : '12px',
            background: COLORS.borderMedium,
            borderRadius: '10px',
            cursor: 'pointer',
            position: 'relative',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          onMouseEnter={(e) => {
            if (!isCollapsed) {
              e.currentTarget.style.background = COLORS.borderLight;
            }
          }}
          onMouseLeave={(e) => {
            if (!isCollapsed) {
              e.currentTarget.style.background = COLORS.borderMedium;
            }
          }}
        >
          <div style={{ position: 'relative' }}>
            <div style={{
              width: isCollapsed ? '48px' : '42px',
              height: isCollapsed ? '48px' : '42px',
              background: COLORS.burntOrange,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.white,
              fontWeight: 700,
              fontSize: isCollapsed ? '18px' : '15px',
              transition: 'all 0.3s ease'
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
          {!isCollapsed && (
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '14px', color: COLORS.textPrimary, margin: 0 }}>{userProfile.name}</p>
              <p style={{ fontSize: '12px', color: COLORS.textSecondary, margin: 0 }}>{userProfile.role}</p>
            </div>
          )}
        </div>
        
        {/* Profile Dropdown Menu */}
        {showProfileDropdown && !isCollapsed && (
          <div 
            ref={profileDropdownRef}
            style={{
            position: 'absolute',
            bottom: '80px',
            left: '20px',
            right: '20px',
            background: COLORS.whiteCard,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: `1px solid ${COLORS.borderLight}`,
            overflow: 'hidden',
            zIndex: 1000
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileDropdown(false);
                if (onLogout) onLogout();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                color: COLORS.error,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.error;
                e.currentTarget.style.color = COLORS.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = COLORS.error;
              }}
            >
              <LogOut style={{ fontSize: '16px' }} />
              Sign Out
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Sidebar;