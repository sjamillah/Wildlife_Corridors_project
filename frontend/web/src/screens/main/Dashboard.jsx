import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Users, Activity, Globe } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { DashboardHeader } from '../../components/shared/HeaderVariants';
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

  const handleNotificationClick = () => {
    // Handle notification click
    console.log('Notification clicked');
  };

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader stats={stats} onNotificationClick={handleNotificationClick} />
        
        <div className="flex-1 overflow-y-auto">
          {/* Stats Cards */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-highlight px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-text-secondary">Active Alerts</p>
                    <p className="text-2xl sm:text-3xl font-bold text-brand-text">{stats.activeAlerts}</p>
                  </div>
                  <div className="p-3 bg-brand-accent/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-text-secondary">Rangers On Duty</p>
                    <p className="text-2xl sm:text-3xl font-bold text-brand-text">{stats.rangersOnDuty}</p>
                  </div>
                  <div className="p-3 bg-brand-secondary/20 rounded-xl">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-text-secondary">System Health</p>
                    <p className="text-2xl sm:text-3xl font-bold text-brand-text">{stats.systemHealth}%</p>
                  </div>
                  <div className="p-3 bg-brand-accent/20 rounded-xl">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                  </div>
                </div>
              </div>

              <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-text-secondary">Tracked Animals</p>
                    <p className="text-2xl sm:text-3xl font-bold text-brand-text">{stats.trackedAnimals}</p>
                  </div>
                  <div className="p-3 bg-brand-accent/20 rounded-xl">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <div className="animate-fade-in">
                <ThreatRadar />
              </div>
              <div className="animate-fade-in">
                <OperationsMap />
              </div>
            </div>

            <div className="mt-4 sm:mt-6 animate-slide-up">
              <ThreatTimeline />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;