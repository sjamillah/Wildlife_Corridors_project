import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wifi, AlertTriangle, Activity, Calendar, TrendingUp, Settings, LogOut, ChevronLeft } from '@/components/shared/Icons';
const AureynxLogo = '/assets/Aureynx_Logo.webp';

const TrackingSidebar = ({ sidebarOpen, setSidebarOpen, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-brand-bg border-r border-brand-border transition-all duration-300 flex flex-col h-screen`} style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>
      <div className="p-4 sm:p-6 border-b border-brand-border flex items-center justify-between">
        {sidebarOpen ? (
          <div className="flex items-center space-x-3">
            <img 
              src={AureynxLogo} 
              alt="Aureynx Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-md object-contain"
            />
            <div>
              <span className="text-lg font-semibold text-brand-text">Aureynx</span>
              <p className="text-xs text-brand-text-secondary">Wildlife Conservation Platform</p>
            </div>
          </div>
        ) : (
          <img 
            src={AureynxLogo} 
            alt="Aureynx Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-md object-contain cursor-pointer" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        {sidebarOpen && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-brand-text-secondary hover:text-brand-text transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">
        {[
          { icon: Home, label: 'Dashboard', route: '/dashboard' },
          { icon: Wifi, label: 'Live Devices', badge: 6, route: '/tracking' },
          { icon: AlertTriangle, label: 'Alerts', badge: 8, route: '/alerts' },
          { icon: Activity, label: 'Wildlife', route: '/wildlife-tracking' },
          { icon: Calendar, label: 'Patrols', route: '/patrol-operations' },
          { icon: TrendingUp, label: 'Reports', route: '/analytics' },
          { icon: Settings, label: 'Settings', route: '/settings' }
        ].map((item, idx) => {
          const active = location.pathname === item.route;
          return (
            <button
              key={idx}
              onClick={() => item.route && navigate(item.route)}
              className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 ${
                active 
                  ? 'bg-brand-primary/10 border border-brand-primary/20 text-brand-primary' 
                  : 'text-brand-text-secondary hover:bg-brand-muted hover:text-brand-text'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${active ? 'text-brand-primary' : 'text-brand-text-secondary'}`} />
                {sidebarOpen && <span className={`font-medium text-sm sm:text-base ${active ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>{item.label}</span>}
              </div>
              {item.badge && sidebarOpen && (
                <span className="px-2 py-0.5 bg-status-error text-white text-xs font-semibold rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-brand-border">
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-status-error hover:bg-status-error/10 rounded-xl transition duration-200"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          {sidebarOpen && <span className="font-medium text-sm sm:text-base">Sign Out</span>}
        </button>
      </div>

      {sidebarOpen && (
        <div className="p-3 sm:p-4 border-t border-brand-border">
          <div className="flex items-center space-x-3 p-3 bg-brand-muted rounded-xl">
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-primary rounded-lg flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                JD
              </div>
              <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-status-success border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-brand-text text-xs sm:text-sm truncate">Jane Doe</p>
              <p className="text-xs text-brand-text-secondary">Conservation Manager</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingSidebar;