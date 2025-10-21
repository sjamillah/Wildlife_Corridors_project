import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Zap, Shield, Clock, AlertTriangle, CheckCircle, Users, MapPin, Activity, Eye, Battery, Heart, Wrench } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { AlertHubHeader } from '../../components/shared/HeaderVariants';

const AlertHub = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setSelectedAlert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  const [alerts] = useState([
    {
      id: 'ALT-001',
      type: 'Critical',
      title: 'Human-Elephant Conflict',
      description: 'Nafisa herd approaching Kimana Village - KWS rangers dispatched',
      location: 'Kimana Village, Kajiado',
      timestamp: '2 min ago',
      status: 'active',
      priority: 'critical',
      animalId: 'KWS-E12',
      animalType: 'African Elephant',
      coordinates: [34.8532, -2.0891],
      responseTeam: 'KWS Amboseli Unit',
      estimatedRisk: 'High',
      icon: 'MdEmergency'
    },
    {
      id: 'ALT-002',
      type: 'Warning',
      title: 'Collar Battery Critical',
      description: 'Duma\'s GPS collar at 12% battery - field team scheduled for tomorrow',
      location: 'Aberdare National Park',
      timestamp: '15 min ago',
      status: 'acknowledged',
      priority: 'high',
      animalId: 'KWS-L04',
      animalType: 'Leopard',
      coordinates: [34.7821, -2.1245],
      responseTeam: 'Tech Team',
      estimatedRisk: 'Medium',
      icon: 'MdBattery0Bar'
    },
    {
      id: 'ALT-003',
      type: 'Health',
      title: 'Unusual Movement Pattern',
      description: 'Animal showing abnormal movement - possible injury or illness',
      location: 'Highway Corridor',
      timestamp: '1 hour ago',
      status: 'investigating',
      priority: 'medium',
      animalId: 'R-008',
      animalType: 'Black Rhino',
      coordinates: [34.8901, -2.0672],
      responseTeam: 'Vet Team',
      estimatedRisk: 'Medium',
      icon: 'Heart'
    },
    {
      id: 'ALT-004',
      type: 'Maintenance',
      title: 'Scheduled Collar Check',
      description: 'Routine maintenance window for GPS collar diagnostics',
      location: 'Acacia Grove',
      timestamp: '3 hours ago',
      status: 'resolved',
      priority: 'low',
      animalId: 'G-017',
      animalType: 'Giraffe',
      coordinates: [34.8234, -2.1089],
      responseTeam: 'Maintenance',
      estimatedRisk: 'Low',
      icon: 'MdConstruction'
    },
    {
      id: 'ALT-005',
      type: 'Security',
      title: 'Fence Breach Detected',
      description: 'Perimeter sensors indicate possible fence damage in protected area',
      location: 'North Ridge - Fence Line 4',
      timestamp: '5 hours ago',
      status: 'active',
      priority: 'high',
      animalId: 'Multiple',
      animalType: 'Various',
      coordinates: [34.7956, -2.0934],
      responseTeam: 'Security Team',
      estimatedRisk: 'High',
      icon: 'MdShieldHalf'
    }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  const handleNewAlert = () => {
    console.log('Creating new alert...');
  };

  const handleExport = () => {
    console.log('Exporting report...');
  };

  const filteredAlerts = filterStatus === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.status === filterStatus);

  const alertCounts = {
    all: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    investigating: alerts.filter(a => a.status === 'investigating').length,
    resolved: alerts.filter(a => a.status === 'resolved').length
  };

  const priorityCounts = {
    critical: alerts.filter(a => a.priority === 'critical').length,
    high: alerts.filter(a => a.priority === 'high').length,
    medium: alerts.filter(a => a.priority === 'medium').length,
    low: alerts.filter(a => a.priority === 'low').length
  };

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AlertHubHeader 
          alerts={alerts} 
          onNewAlert={handleNewAlert}
          onExport={handleExport}
        />

        {/* Status Overview */}
  <div className="bg-gradient-to-r from-brand-primary to-brand-highlight px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary">Critical Alerts</p>
                  <p className="text-2xl sm:text-3xl font-bold text-brand-text">{priorityCounts.critical}</p>
                </div>
                <div className="p-3 bg-status-error/10 rounded-xl">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-status-error" />
                </div>
              </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary">High Priority</p>
                  <p className="text-2xl sm:text-3xl font-bold text-brand-text">{priorityCounts.high}</p>
                </div>
                <div className="p-3 bg-status-warning/10 rounded-xl">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-status-warning" />
                </div>
              </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary">Investigating</p>
                  <p className="text-2xl sm:text-3xl font-bold text-brand-text">{alertCounts.investigating}</p>
                </div>
                <div className="p-3 bg-status-info/10 rounded-xl">
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 text-status-info" />
                </div>
              </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-lg border border-brand-border p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary">Resolved</p>
                  <p className="text-2xl sm:text-3xl font-bold text-brand-text">{alertCounts.resolved}</p>
                </div>
                <div className="p-3 bg-status-success/10 rounded-xl">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-status-success" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Filter Tabs */}
            <div className="bg-brand-surface rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-brand-border shadow-lg animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search alerts by ID, type, or location..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'All Alerts', count: alertCounts.all, icon: Bell },
                  { key: 'active', label: 'Active', count: alertCounts.active, icon: AlertTriangle },
                  { key: 'acknowledged', label: 'Acknowledged', count: alertCounts.acknowledged, icon: Eye },
                  { key: 'investigating', label: 'Investigating', count: alertCounts.investigating, icon: Search },
                  { key: 'resolved', label: 'Resolved', count: alertCounts.resolved, icon: CheckCircle }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterStatus(tab.key)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition ${
                      filterStatus === tab.key
                        ? 'bg-brand-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden"
                >
                  <div className={`h-1 ${
                    alert.priority === 'critical' ? 'bg-red-500' : 
                    alert.priority === 'high' ? 'bg-orange-500' : 
                    alert.priority === 'medium' ? 'bg-yellow-500' : 
                    'bg-brand-primary'
                  }`} />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                                <div className="text-4xl">
                                  {alert.type === 'Critical' && <AlertTriangle className="w-10 h-10 text-red-600" />}
                                  {alert.type === 'Warning' && <Battery className="w-10 h-10 text-orange-600" />}
                                  {alert.type === 'Health' && <Heart className="w-10 h-10 text-brand-moss" />}
                                  {alert.type === 'Maintenance' && <Wrench className="w-10 h-10 text-brand-earth" />}
                                  {alert.type === 'Security' && <Shield className="w-10 h-10 text-gray-700" />}
                                </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{alert.title}</h3>
                            <span className="text-xs text-gray-400 font-mono">{alert.id}</span>
                          </div>
                          <p className="text-gray-600 mb-2">{alert.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{alert.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{alert.timestamp}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{alert.responseTeam}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold">
                          {alert.status === 'active' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {alert.status === 'acknowledged' && <Eye className="w-4 h-4 text-brand-primary" />}
                          {alert.status === 'investigating' && <Search className="w-4 h-4 text-yellow-600" />}
                          {alert.status === 'resolved' && <CheckCircle className="w-4 h-4 text-brand-primary" />}
                          <span className="text-gray-700">{alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}</span>
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          alert.priority === 'critical' ? 'bg-red-500 text-white' :
                          alert.priority === 'high' ? 'bg-orange-500 text-white' :
                          alert.priority === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {alert.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-brand-primary" />
                          <span className="text-sm text-gray-600">{alert.animalType} - {alert.animalId}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-brand-primary" />
                          <span className="text-sm text-gray-600">Risk: {alert.estimatedRisk}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-brand-primary hover:bg-brand-earth text-white text-sm font-semibold rounded-lg transition flex items-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>Respond</span>
                        </button>
                        <button className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertHub;