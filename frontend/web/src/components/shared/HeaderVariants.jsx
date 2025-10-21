import React from 'react';
import { Bell, Activity, TrendingUp } from '@/components/shared/Icons';

// Dashboard Header - Mission Control Style
export const DashboardHeader = ({ stats, onNotificationClick }) => (
  <div className="bg-white min-h-[88px] flex items-center w-full px-6 py-4">
    <div className="flex flex-row items-center justify-between w-full gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-text leading-tight">Wildlife Control</h1>
        <p className="text-brand-text-secondary text-lg leading-snug">Aureynx Conservation Operations Center</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-brand-success/10 rounded-lg border border-brand-success">
          <div className="w-2 h-2 bg-status-success rounded-full"></div>
          <span className="text-brand-success text-base font-medium">System Online</span>
        </div>
        <button 
          onClick={onNotificationClick}
          className="relative p-2 bg-brand-primary hover:bg-brand-highlight text-white rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6" />
          {stats?.activeAlerts > 0 && (
            <span className="absolute -top-1 -right-1 bg-status-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {stats.activeAlerts}
            </span>
          )}
        </button>
      </div>
    </div>
  </div>
);

// Wildlife Tracking Header - Nature Theme
export const WildlifeHeader = ({ animals, onRefresh }) => (
  <div className="bg-white min-h-[88px] flex items-center w-full px-6 py-4">
    <div className="flex flex-row items-center justify-between w-full gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-text leading-tight">Wildlife Tracking</h1>
        <p className="text-brand-text-secondary text-lg leading-snug">Real-time animal monitoring & conservation</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-brand-primary/10 rounded-lg border border-brand-primary">
          <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
          <span className="text-brand-primary text-base font-medium">{animals?.length || 0} Active</span>
        </div>
        <button 
          onClick={onRefresh}
          className="p-2 bg-brand-primary hover:bg-brand-highlight text-white rounded-lg transition-colors"
          aria-label="Refresh"
        >
          <Activity className="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
);

// Live Tracking Header - Tech Theme
export const LiveTrackingHeader = ({ devices, lastSync }) => (
  <div className="bg-white min-h-[88px] flex items-center w-full px-6 py-4">
    <div className="flex flex-row items-center justify-between w-full gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-text leading-tight">Live Device Tracking</h1>
        <p className="text-brand-text-secondary text-lg leading-snug">Real-time monitoring and device status</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-brand-primary/10 rounded-lg border border-brand-primary">
          <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
          <span className="text-brand-primary text-base font-medium">Live</span>
        </div>
        <div className="text-base text-brand-primary font-medium">
          Last sync: {lastSync || new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
        </div>
      </div>
    </div>
  </div>
);

// Alert Hub Header - Emergency Theme
export const AlertHubHeader = ({ alerts, onNewAlert, onExport }) => (
  <div className="bg-white min-h-[88px] flex items-center w-full px-6 py-4">
    <div className="flex flex-row items-center justify-between w-full gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-text leading-tight">Alert Management</h1>
        <p className="text-brand-text-secondary text-lg leading-snug">Monitor and respond to wildlife incidents</p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onExport}
          className="px-4 py-2 border border-brand-primary text-brand-primary font-medium rounded-lg hover:bg-brand-primary/10 text-base transition-colors"
        >
          Export Report
        </button>
        <button 
          onClick={onNewAlert}
          className="px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-highlight text-base transition-colors"
        >
          New Alert
        </button>
      </div>
    </div>
  </div>
);

// Analytics Header - Data Theme
export const AnalyticsHeader = ({ metrics, onRefresh }) => (
  <div className="bg-white min-h-[88px] flex items-center w-full px-6 py-4">
    <div className="flex flex-row items-center justify-between w-full gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-text leading-tight">Analytics Dashboard</h1>
        <p className="text-brand-text-secondary text-lg leading-snug">Conservation insights & data visualization</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-brand-success/10 rounded-lg border border-brand-success">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-brand-success text-base font-medium">Live Data</span>
        </div>
        <button 
          onClick={onRefresh}
          className="p-2 bg-brand-primary hover:bg-brand-highlight text-white rounded-lg transition-colors"
          aria-label="Refresh"
        >
          <TrendingUp className="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
);

// Settings Header - Professional Theme
export const SettingsHeader = ({ onSave, hasChanges }) => (
  <div className="bg-white min-h-[88px] flex items-center w-full px-6 py-4">
    <div className="flex flex-row items-center justify-between w-full gap-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-text leading-tight">System Settings</h1>
        <p className="text-brand-text-secondary text-lg leading-snug">Configure your conservation platform</p>
      </div>
      <div className="flex items-center gap-3">
        {hasChanges && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 rounded-lg border border-yellow-400">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-yellow-700 text-base font-medium">Unsaved Changes</span>
          </div>
        )}
        <button 
          onClick={onSave}
          className={`px-4 py-2 font-medium rounded-lg text-base transition-colors ${
            hasChanges 
              ? 'bg-brand-primary text-white hover:bg-brand-highlight' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!hasChanges}
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

// Generic Header for other screens
export const GenericHeader = ({ title, subtitle, icon: Icon, actions, theme = 'default' }) => {
  return (
    <div className="bg-white min-h-[88px] flex items-center w-full px-6 py-4">
      <div className="flex flex-row items-center justify-between w-full gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text leading-tight">{title}</h1>
          {subtitle && <p className="text-brand-text-secondary text-lg leading-snug">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
