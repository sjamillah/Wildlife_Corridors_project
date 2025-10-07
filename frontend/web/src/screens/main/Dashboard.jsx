import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Users, Activity, Globe } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import ThreatRadar from '../../components/dashboard/ThreatRadar';
import OperationsMap from '../../components/dashboard/OperationsMap';
import ThreatTimeline from '../../components/dashboard/ThreatTimeline';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats] = useState({
    activeAlerts: 3,
    rangersOnDuty: 12,
    systemHealth: 98,
    trackedAnimals: 47
  });
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  const Header = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Aureynx Conservation Operations Center</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">System Online</span>
          </div>
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            {stats.activeAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {stats.activeAlerts}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto">
          {/* Stats Cards */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-3xl font-semibold text-gray-900">{stats.activeAlerts}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rangers On Duty</p>
                  <p className="text-3xl font-semibold text-gray-900">{stats.rangersOnDuty}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-3xl font-semibold text-gray-900">{stats.systemHealth}%</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tracked Animals</p>
                  <p className="text-3xl font-semibold text-gray-900">{stats.trackedAnimals}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Globe className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ThreatRadar />
              </div>
              <div>
                <OperationsMap />
              </div>
            </div>

            <div className="mt-6">
              <ThreatTimeline />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;