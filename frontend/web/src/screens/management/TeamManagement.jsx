import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Filter, Mail, MapPin, Calendar, Award, Activity, CheckCircle, Clock, AlertTriangle, Phone } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';

const TeamManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  const teamMembers = [
    {
      id: 'TM-001',
      name: 'Dr. Jane Mwangi',
      role: 'Senior Wildlife Biologist',
      department: 'KWS Research',
      email: 'j.mwangi@kws.go.ke',
      phone: '+254 700 123 456',
      status: 'active',
      location: 'Tsavo Research Station',
      joinDate: '2022-03-15',
      specialization: 'Elephant Ecology',
      certifications: ['PhD Wildlife Biology', 'CITES Permit'],
      currentAssignment: 'Tsavo Elephant Project',
      avatar: 'JM',
      performance: 95
    },
    {
      id: 'TM-002', 
      name: 'Samuel Kiprotich',
      role: 'Field Ranger',
      department: 'Operations',
      email: 'samuel.k@aurenyx.com',
      phone: '+254 700 234 567',
      status: 'on-patrol',
      location: 'North Corridor',
      joinDate: '2021-07-20',
      specialization: 'Anti-Poaching',
      certifications: ['Firearms Training', 'Emergency Response'],
      currentAssignment: 'Patrol Team Alpha',
      avatar: 'SK',
      performance: 92
    },
    {
      id: 'TM-003',
      name: 'Grace Njeri',
      role: 'Community Liaison', 
      department: 'Outreach',
      email: 'grace.njeri@aurenyx.com',
      phone: '+254 700 345 678',
      status: 'active',
      location: 'Community Center',
      joinDate: '2023-01-10',
      specialization: 'Community Engagement',
      certifications: ['Conflict Resolution', 'Public Speaking'],
      currentAssignment: 'Village Outreach Program',
      avatar: 'GN',
      performance: 88
    },
    {
      id: 'TM-004',
      name: 'Michael Ochieng',
      role: 'Senior Ranger',
      department: 'Operations',
      email: 'michael.o@aurenyx.com', 
      phone: '+254 700 456 789',
      status: 'leave',
      location: 'Base Station',
      joinDate: '2020-05-12',
      specialization: 'Team Leadership',
      certifications: ['Leadership Training', 'Crisis Management'],
      currentAssignment: 'Team Coordination',
      avatar: 'MO',
      performance: 96
    },
    {
      id: 'TM-005',
      name: 'Dr. Robert Maina',
      role: 'Veterinarian',
      department: 'Medical',
      email: 'robert.maina@aurenyx.com',
      phone: '+254 700 567 890',
      status: 'active',
      location: 'Medical Unit',
      joinDate: '2021-11-03',
      specialization: 'Wildlife Medicine',
      certifications: ['Veterinary Medicine', 'Wildlife Surgery'],
      currentAssignment: 'Health Monitoring Program',
      avatar: 'RM',
      performance: 94
    }
  ];

  const teams = [
    {
      id: 'TEAM-001',
      name: 'Alpha Team',
      leader: 'Samuel Kiprotich',
      members: 4,
      department: 'Field Operations',
      status: 'active',
      currentMission: 'Northern Corridor Patrol',
      efficiency: 95,
      lastDeployment: '2024-10-01'
    },
    {
      id: 'TEAM-002', 
      name: 'Research Unit',
      leader: 'Dr. Jane Mwangi',
      members: 6,
      department: 'Research',
      status: 'active',
      currentMission: 'Migration Pattern Study',
      efficiency: 92,
      lastDeployment: '2024-09-28'
    },
    {
      id: 'TEAM-003',
      name: 'Community Outreach',
      leader: 'Grace Njeri', 
      members: 3,
      department: 'Public Relations',
      status: 'active',
      currentMission: 'Village Education Program',
      efficiency: 88,
      lastDeployment: '2024-09-30'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-white border border-green-200 text-green-700';
      case 'on-patrol': return 'bg-white border border-blue-200 text-blue-700';
      case 'leave': return 'bg-white border border-yellow-200 text-yellow-700';
      case 'inactive': return 'bg-white border border-red-200 text-red-700';
      default: return 'bg-white border border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'on-patrol': return <Activity className="w-4 h-4" />;
      case 'leave': return <Clock className="w-4 h-4" />;
      case 'inactive': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'members', label: 'Team Members', count: teamMembers.length },
    { id: 'teams', label: 'Teams', count: teams.length },
    { id: 'assignments', label: 'Assignments', count: 12 },
    { id: 'performance', label: 'Performance', count: null }
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-8 py-6 shadow-sm" style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Field Personnel</h1>
                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                  {teamMembers.length} Members
                </span>
              </div>
              <p className="text-sm text-gray-500">Manage team members, assignments, and performance</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-white border-2 border-emerald-500' : 'bg-gray-200'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'members' && (
              <div>
                {/* Search */}
                <div className="bg-white rounded-xl p-8 mb-8 border border-gray-100 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Members Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMembers.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {member.avatar}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{member.name}</h4>
                              <p className="text-sm text-gray-600">{member.role}</p>
                            </div>
                          </div>
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                            {getStatusIcon(member.status)}
                            <span>{member.status}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{member.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{member.location}</span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Performance</span>
                            <span className="text-sm font-semibold text-emerald-600">{member.performance}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full transition-all"
                              style={{ width: `${member.performance}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 text-xs text-gray-500">
                          <p><strong>Assignment:</strong> {member.currentAssignment}</p>
                          <p><strong>Joined:</strong> {member.joinDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Teams</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {teams.map((team) => (
                    <div key={team.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{team.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
                          {team.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Team Leader:</span>
                          <span className="font-medium">{team.leader}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Members:</span>
                          <span className="font-medium">{team.members}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Department:</span>
                          <span className="font-medium">{team.department}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Current Mission:</span>
                          <span className="font-medium">{team.currentMission}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Efficiency</span>
                          <span className="text-sm font-semibold text-emerald-600">{team.efficiency}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${team.efficiency}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-8 rounded-xl mt-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Members</p>
                      <p className="text-3xl font-semibold text-gray-900">{teamMembers.length}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">+2 this month</p>
                </div>
                
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Teams</p>
                      <p className="text-3xl font-semibold text-gray-900">{teams.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">All operational</p>
                </div>
                
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                      <p className="text-3xl font-semibold text-gray-900">93%</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-purple-600 mt-2">+3% this quarter</p>
                </div>
                
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">On Leave</p>
                      <p className="text-3xl font-semibold text-gray-900">1</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-sm text-orange-600 mt-2">Michael Ochieng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;