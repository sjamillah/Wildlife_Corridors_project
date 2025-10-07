import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Calendar, Clock, Route, Shield, CheckCircle, AlertTriangle, Plus, Search, Navigation, Camera, Moon } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';

const PatrolOperations = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setSelectedPatrol] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const navigate = useNavigate();

  const [patrols] = useState([
    {
      id: 'PTRL-001',
      name: 'Tsavo East Perimeter',
      status: 'active',
      priority: 'high',
      team: 'KWS Unit Alpha',
      leader: 'Senior Warden Kamau',
      members: ['J. Kamau', 'M. Wanjiku', 'P. Mwangi', 'S. Achieng'],
      startTime: '06:00',
      expectedDuration: '8 hours',
      currentLocation: 'Voi Gate Section',
      route: 'Voi Gate → Aruba Dam → Mudanda Rock',
      objectives: ['Perimeter Check', 'Anti-Poaching', 'Wildlife Count'],
      equipment: ['GPS Units', 'Radios', 'First Aid', 'Camera Traps'],
      progress: 45,
      lastUpdate: '2 min ago',
      coordinates: [34.8532, -2.0891],
      incidents: 1,
      icon: '🚶‍♂️'
    },
    {
      id: 'PTRL-002',
      name: 'Village Outreach Program',
      status: 'scheduled',
      priority: 'medium',
      team: 'Beta Team',
      leader: 'Sarah Muthoni',
      members: ['S. Muthoni', 'D. Kipchoge', 'L. Wambui'],
      startTime: '09:00',
      expectedDuration: '6 hours',
      currentLocation: 'Base Station',
      route: 'Village A → School → Community Center → Village B',
      objectives: ['Education', 'Conflict Mitigation', 'Data Collection'],
      equipment: ['Educational Materials', 'Survey Forms', 'Gifts'],
      progress: 0,
      lastUpdate: '1 hour ago',
      coordinates: [34.7821, -2.1245],
      incidents: 0,
      icon: '🏫'
    },
    {
      id: 'PTRL-003',
      name: 'Emergency Response - Elephant',
      status: 'active',
      priority: 'critical',
      team: 'Charlie Team',
      leader: 'Michael Ochieng',
      members: ['M. Ochieng', 'A. Njeru', 'F. Wanjala', 'G. Kiprotich'],
      startTime: '14:30',
      expectedDuration: '4 hours',
      currentLocation: 'Village X Outskirts',
      route: 'Emergency Response → Herd Location → Safe Corridor',
      objectives: ['Animal Relocation', 'Public Safety', 'Damage Assessment'],
      equipment: ['Deterrent Equipment', 'Emergency Kit', 'Communication Gear'],
      progress: 75,
      lastUpdate: '5 min ago',
      coordinates: [34.8901, -2.0672],
      incidents: 2,
      icon: 'AlertTriangle'
    },
    {
      id: 'PTRL-004',
      name: 'Camera Trap Maintenance',
      status: 'completed',
      priority: 'low',
      team: 'Delta Team',
      leader: 'Grace Njoki',
      members: ['G. Njoki', 'T. Mutua'],
      startTime: '07:00',
      expectedDuration: '5 hours',
      currentLocation: 'Base Station',
      route: 'Trap Site 1 → Trap Site 2 → Trap Site 3',
      objectives: ['Equipment Check', 'Data Download', 'Battery Replacement'],
      equipment: ['Tools', 'Batteries', 'SD Cards', 'Cleaning Kit'],
      progress: 100,
      lastUpdate: '2 hours ago',
      coordinates: [34.8234, -2.1089],
      incidents: 0,
      icon: '📷'
    },
    {
      id: 'PTRL-005',
      name: 'Night Surveillance',
      status: 'scheduled',
      priority: 'high',
      team: 'Echo Team',
      leader: 'Robert Maina',
      members: ['R. Maina', 'C. Wafula', 'J. Kibet'],
      startTime: '20:00',
      expectedDuration: '10 hours',
      currentLocation: 'Base Station',
      route: 'Hot Spot Alpha → Hot Spot Beta → Hot Spot Gamma',
      objectives: ['Anti-Poaching', 'Night Movement Monitoring', 'Deterrent Patrol'],
      equipment: ['Night Vision', 'Thermal Cameras', 'Silent Radios', 'Emergency Flares'],
      progress: 0,
      lastUpdate: '30 min ago',
      coordinates: [34.7956, -2.0934],
      incidents: 0,
      icon: '🌙'
    }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  const filteredPatrols = viewMode === 'all' 
    ? patrols 
    : patrols.filter(patrol => patrol.status === viewMode);

  const statusCounts = {
    all: patrols.length,
    active: patrols.filter(p => p.status === 'active').length,
    scheduled: patrols.filter(p => p.status === 'scheduled').length,
    completed: patrols.filter(p => p.status === 'completed').length
  };

  const priorityCounts = {
    critical: patrols.filter(p => p.priority === 'critical').length,
    high: patrols.filter(p => p.priority === 'high').length,
    medium: patrols.filter(p => p.priority === 'medium').length,
    low: patrols.filter(p => p.priority === 'low').length
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Patrol Operations</h1>
              <p className="text-sm text-gray-600 mt-1">Coordinate field teams and missions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium">
                  <span>Teams: {patrols.length}</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                  <span>Critical: {priorityCounts.critical}</span>
                </div>
              </div>
              <button className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Deploy Team
              </button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Patrols</p>
                  <p className="text-3xl font-semibold text-gray-900">{statusCounts.active}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled Today</p>
                  <p className="text-3xl font-semibold text-gray-900">{statusCounts.scheduled}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Missions</p>
                  <p className="text-3xl font-semibold text-gray-900">{priorityCounts.critical}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-3xl font-semibold text-gray-900">{statusCounts.completed}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Search & Filter */}
            <div className="bg-white rounded-xl p-6 mb-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search missions, teams, objectives..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
                  />
                </div>
                
                <div className="flex space-x-2">
                  {[
                    { key: 'all', label: 'All Patrols', count: statusCounts.all, icon: Users },
                    { key: 'active', label: 'Active', count: statusCounts.active, icon: Navigation },
                    { key: 'scheduled', label: 'Scheduled', count: statusCounts.scheduled, icon: Calendar },
                    { key: 'completed', label: 'Completed', count: statusCounts.completed, icon: CheckCircle }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setViewMode(tab.key)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === tab.key
                          ? 'bg-emerald-100 border border-emerald-500 text-emerald-700'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        viewMode === tab.key ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mission Briefings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPatrols.map((patrol) => (
                <div
                  key={patrol.id}
                  onClick={() => setSelectedPatrol(patrol)}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-gray-100 overflow-hidden"
                >
                  <div className={`h-1 ${
                    patrol.priority === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                    patrol.priority === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                    patrol.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                    'bg-gradient-to-r from-green-500 to-green-600'
                  }`} />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                          patrol.priority === 'critical' ? 'border-red-500/60 bg-red-500/10' : 
                          patrol.priority === 'high' ? 'border-orange-500/60 bg-orange-500/10' : 
                          patrol.priority === 'medium' ? 'border-yellow-500/60 bg-yellow-500/10' : 
                          'border-green-500/60 bg-green-500/10'
                        }`}>
                          {patrol.id === 'PTRL-001' && <Navigation className="w-6 h-6 text-green-400" />}
                          {patrol.id === 'PTRL-002' && <Camera className="w-6 h-6 text-blue-400" />}
                          {patrol.id === 'PTRL-003' && <AlertTriangle className="w-6 h-6 text-red-400" />}
                          {patrol.id === 'PTRL-004' && <Camera className="w-6 h-6 text-amber-400" />}
                          {patrol.id === 'PTRL-005' && <Moon className="w-6 h-6 text-purple-400" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg mb-1">{patrol.name}</h3>
                          <p className="text-sm text-gray-400 font-mono uppercase tracking-wider">{patrol.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          patrol.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          patrol.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            patrol.status === 'active' ? 'bg-green-400 animate-pulse' :
                            patrol.status === 'scheduled' ? 'bg-blue-400' :
                            'bg-gray-400'
                          }`}></div>
                          <span>{patrol.status}</span>
                        </span>
                        <span className={`text-xs font-mono px-2 py-1 rounded ${
                          patrol.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
                          patrol.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                          patrol.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {patrol.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-brand-primary" />
                          <span className="text-sm text-gray-600">{patrol.team} - {patrol.leader}</span>
                        </div>
                        <span className="text-xs text-gray-500">{patrol.members.length} members</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-brand-primary" />
                        <span className="text-sm text-gray-600">{patrol.currentLocation}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-brand-primary" />
                        <span className="text-sm text-gray-600">{patrol.startTime} • {patrol.expectedDuration}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Route className="w-4 h-4 text-brand-primary" />
                        <span className="text-sm text-gray-600 truncate">{patrol.route}</span>
                      </div>
                    </div>

                    {patrol.status === 'active' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600 font-medium">Progress</span>
                          <span className="text-xs text-gray-900 font-bold">{patrol.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${patrol.progress > 50 ? 'bg-brand-primary' : 'bg-amber-500'}`}
                            style={{ width: `${patrol.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                          <Shield className="w-4 h-4 text-brand-primary" />
                          <span className="text-xs text-gray-600">{patrol.objectives.length} objectives</span>
                        </div>
                        {patrol.incidents > 0 && (
                            <div className="flex items-center space-x-1">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-600">{patrol.incidents} incidents</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{patrol.lastUpdate}</span>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium transition">
                        Track Live
                      </button>
                      <button className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-lg transition">
                        Details
                      </button>
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

export default PatrolOperations;