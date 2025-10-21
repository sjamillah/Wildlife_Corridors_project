import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Calendar, Clock, Route, Shield, CheckCircle, AlertTriangle, Plus, Search, Navigation, Camera, Moon, X, User, Phone, Play, Square, Eye } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';

const PatrolOperations = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPatrol, setSelectedPatrol] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [showPatrolDetails, setShowPatrolDetails] = useState(false);
  const [trackingPatrols, setTrackingPatrols] = useState({});
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

  // Available team members for deployment
  const availableTeamMembers = [
    {
      id: 1,
      name: 'John Kamau',
      role: 'Senior Ranger',
      experience: '8 years',
      specialization: 'Anti-Poaching',
      status: 'Available',
      phone: '+254 712 345 678',
      lastDeployment: '2 days ago'
    },
    {
      id: 2,
      name: 'Mary Wanjiku',
      role: 'Wildlife Tracker',
      experience: '5 years',
      specialization: 'Animal Behavior',
      status: 'Available',
      phone: '+254 723 456 789',
      lastDeployment: '1 day ago'
    },
    {
      id: 3,
      name: 'Peter Mwangi',
      role: 'Communications Officer',
      experience: '6 years',
      specialization: 'Radio Operations',
      status: 'Available',
      phone: '+254 734 567 890',
      lastDeployment: '3 days ago'
    },
    {
      id: 4,
      name: 'Sarah Achieng',
      role: 'Veterinary Assistant',
      experience: '4 years',
      specialization: 'Animal Health',
      status: 'Available',
      phone: '+254 745 678 901',
      lastDeployment: '1 week ago'
    },
    {
      id: 5,
      name: 'David Kipchoge',
      role: 'Community Liaison',
      experience: '7 years',
      specialization: 'Public Relations',
      status: 'Available',
      phone: '+254 756 789 012',
      lastDeployment: '4 days ago'
    },
    {
      id: 6,
      name: 'Grace Njoki',
      role: 'Equipment Specialist',
      experience: '3 years',
      specialization: 'Tech Maintenance',
      status: 'Available',
      phone: '+254 767 890 123',
      lastDeployment: '5 days ago'
    }
  ];

  // Available deployment areas
  const deploymentAreas = [
    {
      id: 1,
      name: 'Northern Perimeter',
      zone: 'Zone A',
      priority: 'High',
      terrain: 'Grassland',
      riskLevel: 'Moderate',
      coordinates: 'Grid A1-A5'
    },
    {
      id: 2,
      name: 'Eastern Ridge Trail',
      zone: 'Zone B',
      priority: 'Medium',
      terrain: 'Rocky',
      riskLevel: 'Low',
      coordinates: 'Grid B3-B7'
    },
    {
      id: 3,
      name: 'Village Outskirts',
      zone: 'Zone C',
      priority: 'Critical',
      terrain: 'Mixed',
      riskLevel: 'High',
      coordinates: 'Grid C2-C6'
    },
    {
      id: 4,
      name: 'Waterhole Sector',
      zone: 'Zone D',
      priority: 'High',
      terrain: 'Wetland',
      riskLevel: 'Moderate',
      coordinates: 'Grid D1-D4'
    },
    {
      id: 5,
      name: 'Research Station Area',
      zone: 'Zone E',
      priority: 'Low',
      terrain: 'Forest',
      riskLevel: 'Low',
      coordinates: 'Grid E5-E8'
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  const handleDeployTeam = () => {
    if (selectedTeamMembers.length === 0 || !selectedArea) {
      return;
    }

    // Get selected team member names
    const selectedMembers = availableTeamMembers
      .filter(member => selectedTeamMembers.includes(member.id))
      .map(member => member.name);

    // Get selected area details
    const selectedAreaDetails = deploymentAreas.find(area => area.id === selectedArea);

    // Create deployment confirmation
    const deploymentData = {
      teamMembers: selectedMembers,
      area: selectedAreaDetails?.name,
      zone: selectedAreaDetails?.zone,
      timestamp: new Date().toLocaleString(),
      id: `PTRL-${String(patrols.length + 1).padStart(3, '0')}`
    };

    // Show success message (in a real app, this would be an API call)
    alert(`✅ Team Successfully Deployed!\n\nMission ID: ${deploymentData.id}\nTeam: ${selectedMembers.join(', ')}\nArea: ${deploymentData.area} (${deploymentData.zone})\nTime: ${deploymentData.timestamp}\n\nThe team has been notified and deployment is now active.`);

    // Reset form and close modal
    setSelectedTeamMembers([]);
    setSelectedArea('');
    setShowDeployModal(false);

    // In a real application, you would:
    // 1. Send data to backend API
    // 2. Update patrol list state
    // 3. Send notifications to team members
    // 4. Update dashboard statistics
  };

  const handleTrackPatrol = (patrol, e) => {
    e.stopPropagation(); // Prevent card click
    if (trackingPatrols[patrol.id]) {
      // Stop tracking
      setTrackingPatrols(prev => ({ ...prev, [patrol.id]: false }));
      alert(`🔴 Stopped tracking ${patrol.name}\n\nPatrol ID: ${patrol.id}\nTeam: ${patrol.team}\nLocation: ${patrol.currentLocation}\n\nLive tracking has been disabled for this patrol.`);
    } else {
      // Start tracking
      setTrackingPatrols(prev => ({ ...prev, [patrol.id]: true }));
      alert(`🟢 Started live tracking ${patrol.name}\n\nPatrol ID: ${patrol.id}\nTeam: ${patrol.team}\nCurrent Location: ${patrol.currentLocation}\nProgress: ${patrol.progress}%\n\nYou will now receive real-time updates for this patrol team.`);
    }
  };

  const handlePatrolDetails = (patrol, e) => {
    e.stopPropagation(); // Prevent card click
    setSelectedPatrol(patrol);
    setShowPatrolDetails(true);
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
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm font-medium">
                  <span>Teams: {patrols.length}</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm font-medium">
                  <span>Critical: {priorityCounts.critical}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowDeployModal(true)}
                className="inline-flex items-center px-4 py-2 bg-brand-primary hover:bg-brand-highlight text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Deploy Team
              </button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
  <div className="bg-gradient-to-r from-brand-primary to-brand-highlight px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-brand-card rounded-lg shadow border border-brand-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary">Active Patrols</p>
                  <p className="text-3xl font-semibold text-brand-text">{statusCounts.active}</p>
                </div>
                <div className="p-3 bg-brand-primary/20 rounded-lg">
                  <Users className="w-6 h-6 text-brand-primary" />
                </div>
              </div>
            </div>
            <div className="bg-brand-card rounded-lg shadow border border-brand-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary">Scheduled Today</p>
                  <p className="text-3xl font-semibold text-brand-text">{statusCounts.scheduled}</p>
                </div>
                <div className="p-3 bg-brand-secondary/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-brand-secondary" />
                </div>
              </div>
            </div>
            <div className="bg-brand-card rounded-lg shadow border border-brand-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary">Critical Missions</p>
                  <p className="text-3xl font-semibold text-brand-text">{priorityCounts.critical}</p>
                </div>
                <div className="p-3 bg-brand-alert/20 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-brand-alert" />
                </div>
              </div>
            </div>
            <div className="bg-brand-card rounded-lg shadow border border-brand-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-text-secondary">Completed Today</p>
                  <p className="text-3xl font-semibold text-brand-text">{statusCounts.completed}</p>
                </div>
                <div className="p-3 bg-brand-success/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-brand-success" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Search & Filter */}
            <div className="bg-brand-surface rounded-xl p-6 mb-6 border border-brand-border shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search missions, teams, objectives..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:border-brand-primary transition text-sm"
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
                          ? 'bg-brand-secondary border border-brand-primary text-brand-text'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        viewMode === tab.key ? 'bg-brand-secondary text-brand-text' : 'bg-gray-100 text-gray-600'
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
                  className="bg-brand-card rounded-lg shadow border border-brand-card p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Remove the colored bar on top */}
                  
                  <div className="p-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                          {patrol.id === 'PTRL-001' && <Navigation className="w-6 h-6 text-brand-primary" />}
                          {patrol.id === 'PTRL-002' && <Camera className="w-6 h-6 text-brand-secondary" />}
                          {patrol.id === 'PTRL-003' && <AlertTriangle className="w-6 h-6 text-brand-alert" />}
                          {patrol.id === 'PTRL-004' && <Camera className="w-6 h-6 text-brand-secondary" />}
                          {patrol.id === 'PTRL-005' && <Moon className="w-6 h-6 text-brand-success" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg mb-1">{patrol.name}</h3>
                          <p className="text-sm text-gray-500 font-mono uppercase tracking-wider">{patrol.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                          <div className={`w-2 h-2 rounded-full ${
                            patrol.status === 'active' ? 'bg-brand-primary animate-pulse' :
                            patrol.status === 'scheduled' ? 'bg-gray-400' :
                            'bg-gray-400'
                          }`}></div>
                          <span>{patrol.status}</span>
                        </span>
                        <span className="text-xs font-mono px-2 py-1 rounded bg-white text-gray-700 border border-gray-300">
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
                      <button 
                        onClick={(e) => handleTrackPatrol(patrol, e)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                          trackingPatrols[patrol.id] 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-brand-primary hover:bg-brand-highlight text-white'
                        }`}
                      >
                        {trackingPatrols[patrol.id] ? (
                          <>
                            <Square className="w-4 h-4" />
                            Stop Tracking
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Track Live
                          </>
                        )}
                      </button>
                      <button 
                        onClick={(e) => handlePatrolDetails(patrol, e)}
                        className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium rounded-lg transition flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
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

      {/* Deploy Team Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-highlight px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Deploy New Team</h2>
                  <p className="text-brand-secondary text-sm">Select team members and deployment area</p>
                </div>
                <button 
                  onClick={() => setShowDeployModal(false)}
                  className="text-white hover:text-brand-secondary transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(95vh - 200px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Team Members Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-brand-primary" />
                    Select Team Members
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {availableTeamMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTeamMembers.includes(member.id)
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => {
                          if (selectedTeamMembers.includes(member.id)) {
                            setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== member.id));
                          } else {
                            setSelectedTeamMembers([...selectedTeamMembers, member.id]);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{member.name}</h4>
                              <p className="text-sm text-gray-600">{member.role}</p>
                              <p className="text-xs text-gray-500">
                                {member.experience} • {member.specialization}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-1 bg-brand-primary/20 text-brand-primary text-xs rounded-full font-medium">
                              {member.status}
                            </span>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3 mr-1" />
                              <span>{member.phone}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Last: {member.lastDeployment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deployment Area Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-brand-primary" />
                    Select Deployment Area
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {deploymentAreas.map((area) => (
                      <div
                        key={area.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedArea === area.id
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => setSelectedArea(area.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{area.name}</h4>
                            <p className="text-sm text-gray-600">{area.zone} • {area.coordinates}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Terrain: {area.terrain}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                              area.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                              area.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                              area.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-brand-primary/10 text-brand-primary'
                            }`}>
                              {area.priority}
                            </span>
                            <p className={`text-xs mt-1 font-medium ${
                              area.riskLevel === 'High' ? 'text-red-600' :
                              area.riskLevel === 'Moderate' ? 'text-yellow-600' :
                              'text-brand-primary'
                            }`}>
                              Risk: {area.riskLevel}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mission Details */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Mission Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mission Objective
                    </label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                      <option>Routine Patrol</option>
                      <option>Anti-Poaching Operation</option>
                      <option>Wildlife Monitoring</option>
                      <option>Emergency Response</option>
                      <option>Community Outreach</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Duration
                    </label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                      <option>2 hours</option>
                      <option>4 hours</option>
                      <option>6 hours</option>
                      <option>8 hours</option>
                      <option>12 hours</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea 
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    rows="3"
                    placeholder="Enter any special instructions or notes for the team..."
                  ></textarea>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-brand-primary/10 rounded-lg border border-brand-primary/30">
                <h4 className="font-semibold text-brand-primary mb-2">Deployment Summary</h4>
                <div className="text-sm text-brand-primary">
                  <p><strong>Team Members:</strong> {selectedTeamMembers.length} selected</p>
                  <p><strong>Area:</strong> {selectedArea ? deploymentAreas.find(a => a.id === selectedArea)?.name : 'None selected'}</p>
                  <p><strong>Status:</strong> Ready to deploy</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setShowDeployModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeployTeam}
                disabled={selectedTeamMembers.length === 0 || !selectedArea}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedTeamMembers.length > 0 && selectedArea
                    ? 'bg-brand-secondary hover:bg-brand-secondary text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Deploy Team ({selectedTeamMembers.length} members)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patrol Details Modal */}
      {showPatrolDetails && selectedPatrol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-highlight px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedPatrol.name}</h2>
                  <p className="text-white text-sm">{selectedPatrol.id} • {selectedPatrol.team}</p>
                </div>
                <button 
                  onClick={() => setShowPatrolDetails(false)}
                  className="text-white hover:text-brand-bg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Status and Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPatrol.status === 'active' ? 'bg-brand-primary/10 text-brand-primary' :
                      selectedPatrol.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        selectedPatrol.status === 'active' ? 'bg-brand-primary/100 animate-pulse' :
                        selectedPatrol.status === 'scheduled' ? 'bg-blue-400' :
                        'bg-gray-400'
                      }`}></div>
                      {selectedPatrol.status.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedPatrol.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      selectedPatrol.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      selectedPatrol.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-brand-primary/10 text-brand-primary'
                    }`}>
                      {selectedPatrol.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  {trackingPatrols[selectedPatrol.id] && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-sm">
                      <div className="w-2 h-2 bg-brand-primary/100 rounded-full animate-pulse"></div>
                      Live Tracking Active
                    </div>
                  )}
                </div>

                {selectedPatrol.status === 'active' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Mission Progress</span>
                      <span className="text-sm font-bold text-gray-900">{selectedPatrol.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-brand-primary transition-all"
                        style={{ width: `${selectedPatrol.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Mission Details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Mission Info</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-primary" />
                      <span className="text-gray-600">Start:</span>
                      <span className="font-medium">{selectedPatrol.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedPatrol.expectedDuration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-primary" />
                      <span className="text-gray-600">Current:</span>
                      <span className="font-medium">{selectedPatrol.currentLocation}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Team Info</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand-primary" />
                      <span className="text-gray-600">Leader:</span>
                      <span className="font-medium">{selectedPatrol.leader}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-primary" />
                      <span className="text-gray-600">Team Size:</span>
                      <span className="font-medium">{selectedPatrol.members.length} members</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <strong>Members:</strong> {selectedPatrol.members.join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Route className="w-4 h-4 text-brand-primary" />
                  Mission Route
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-medium">{selectedPatrol.route}</p>
                </div>
              </div>

              {/* Objectives and Equipment */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Objectives</h4>
                  <ul className="space-y-1">
                    {selectedPatrol.objectives.map((objective, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-brand-primary" />
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Equipment</h4>
                  <ul className="space-y-1">
                    {selectedPatrol.equipment.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Last Update */}
              <div className="text-xs text-gray-500 border-t pt-4">
                <strong>Last Update:</strong> {selectedPatrol.lastUpdate}
                {selectedPatrol.incidents > 0 && (
                  <span className="ml-4 text-red-600">
                    <strong>{selectedPatrol.incidents} incident(s) reported</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setShowPatrolDetails(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleTrackPatrol(selectedPatrol, e)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    trackingPatrols[selectedPatrol.id] 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-brand-secondary hover:bg-brand-secondary text-white'
                  }`}
                >
                  {trackingPatrols[selectedPatrol.id] ? (
                    <>
                      <Square className="w-4 h-4" />
                      Stop Tracking
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Tracking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatrolOperations;