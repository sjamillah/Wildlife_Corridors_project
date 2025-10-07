import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wifi, AlertTriangle, Activity, Calendar, TrendingUp, Settings, LogOut, ChevronLeft } from 'lucide-react';
import AureynxLogo from '../../assets/Aureynx_Logo.png';

const TrackingSidebar = ({ sidebarOpen, setSidebarOpen, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} sidebar-base border-r border-gray-200 transition-all duration-300 flex flex-col h-screen`} style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        {sidebarOpen ? (
          <div className="flex items-center space-x-3">
            <img 
              src={AureynxLogo} 
              alt="Aureynx Logo" 
              className="w-10 h-10 rounded-xl shadow-md object-contain"
            />
            <div>
              <span className="text-lg font-semibold text-gray-900">Aureynx</span>
              <p className="text-xs text-gray-500">Wildlife Conservation Platform</p>
            </div>
          </div>
        ) : (
          <img 
            src={AureynxLogo} 
            alt="Aureynx Logo" 
            className="w-10 h-10 rounded-xl shadow-md object-contain cursor-pointer" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        {sidebarOpen && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-gray-600 transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'nav-item-active' : 'nav-item-inactive nav-item-hover'}`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-brand-earth' : 'text-gray-600'}`} />
                {sidebarOpen && <span className={`font-medium ${active ? 'text-brand-earth' : ''}`}>{item.label}</span>}
              </div>
              {item.badge && sidebarOpen && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="font-medium">Sign Out</span>}
        </button>
      </div>

      {sidebarOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
            <div className="relative">
              <div className="w-10 h-10 bg-brand-2 rounded-lg flex items-center justify-center text-white font-semibold">
                JD
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-1 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">Jane Doe</p>
              <p className="text-xs text-gray-500">Conservation Manager</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingSidebar;