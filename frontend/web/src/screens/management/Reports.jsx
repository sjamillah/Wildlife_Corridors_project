import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, Filter, Search, TrendingUp, Users, Activity, AlertTriangle, Eye, Clock, BarChart } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';

const Reports = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedReport, setSelectedReport] = useState('wildlife');
  const [dateRange, setDateRange] = useState('30d');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  const reportCategories = [
    { id: 'wildlife', label: 'Wildlife Reports', icon: Activity, count: 45 },
    { id: 'patrol', label: 'Patrol Reports', icon: Users, count: 28 },
    { id: 'incident', label: 'Incident Reports', icon: AlertTriangle, count: 12 },
    { id: 'monitoring', label: 'Monitoring Reports', icon: Eye, count: 67 }
  ];

  const reports = {
    wildlife: [
      {
        id: 'WR-2024-001',
        title: 'Monthly Wildlife Movement Analysis',
        description: 'Comprehensive analysis of animal movement patterns and corridor usage',
        date: '2024-10-01',
        author: 'Dr. Jane Mwangi',
        status: 'completed',
        type: 'monthly',
        fileSize: '2.4 MB',
        downloads: 156
      },
      {
        id: 'WR-2024-002', 
        title: 'Elephant Herd Tracking Summary',
        description: 'Weekly tracking report for the main elephant herds in the corridor',
        date: '2024-09-28',
        author: 'Samuel Kiprotich',
        status: 'completed',
        type: 'weekly',
        fileSize: '1.8 MB',
        downloads: 89
      },
      {
        id: 'WR-2024-003',
        title: 'Species Diversity Assessment',
        description: 'Quarterly assessment of species diversity within protected areas',
        date: '2024-09-30',
        author: 'Dr. Grace Njeri',
        status: 'draft',
        type: 'quarterly',
        fileSize: '3.1 MB',
        downloads: 23
      }
    ],
    patrol: [
      {
        id: 'PR-2024-001',
        title: 'Community Engagement Patrol Summary',
        description: 'Report on community outreach activities and engagement metrics',
        date: '2024-09-29',
        author: 'Michael Ochieng',
        status: 'completed',
        type: 'weekly',
        fileSize: '1.2 MB',
        downloads: 67
      },
      {
        id: 'PR-2024-002',
        title: 'Anti-Poaching Operations Report',
        description: 'Monthly summary of anti-poaching patrol activities and outcomes',
        date: '2024-09-25',
        author: 'Captain Robert Maina',
        status: 'completed',
        type: 'monthly',
        fileSize: '2.7 MB',
        downloads: 134
      }
    ],
    incident: [
      {
        id: 'IR-2024-001',
        title: 'Human-Wildlife Conflict Incidents',
        description: 'Analysis of recent human-wildlife conflict cases and resolution strategies',
        date: '2024-09-27',
        author: 'Sarah Wanjiku',
        status: 'completed',
        type: 'incident',
        fileSize: '1.5 MB',
        downloads: 78
      }
    ],
    monitoring: [
      {
        id: 'MR-2024-001',
        title: 'Camera Trap Monitoring Results',
        description: 'Analysis of camera trap data from the past month',
        date: '2024-09-26',
        author: 'Tech Team',
        status: 'completed',
        type: 'monthly',
        fileSize: '4.2 MB',
        downloads: 92
      }
    ]
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-white border border-green-200 text-green-700';
      case 'draft': return 'bg-white border border-yellow-200 text-yellow-700';
      case 'pending': return 'bg-white border border-blue-200 text-blue-700';
      default: return 'bg-white border border-gray-200 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'monthly': return <Calendar className="w-4 h-4" />;
      case 'weekly': return <Clock className="w-4 h-4" />;
      case 'quarterly': return <BarChart className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
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
        <div className="bg-white border-b px-8 py-6 shadow-sm" style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Conservation Reports</h1>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {reports[selectedReport].length} available
                </span>
              </div>
              <p className="text-sm text-gray-500">Research documentation and field reports</p>
            </div>
            <div className="flex items-center space-x-3">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>
              <button className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Report Categories */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {reportCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedReport(category.id)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedReport === category.id
                      ? 'border-2 border-emerald-500 bg-white'
                      : 'border-gray-200 bg-white hover:border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedReport === category.id ? 'bg-emerald-500' : 'bg-gray-100'
                    }`}>
                      <category.icon className={`w-6 h-6 ${
                        selectedReport === category.id ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <span className={`text-2xl font-bold ${
                      selectedReport === category.id ? 'text-emerald-600' : 'text-gray-900'
                    }`}>
                      {category.count}
                    </span>
                  </div>
                  <h3 className={`font-semibold ${
                    selectedReport === category.id ? 'text-emerald-900' : 'text-gray-900'
                  }`}>
                    {category.label}
                  </h3>
                </button>
              ))}
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl p-8 mb-8 border border-gray-100 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {reportCategories.find(cat => cat.id === selectedReport)?.label}
                </h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                    />
                  </div>
                  <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                {reports[selectedReport].map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{report.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <div className="flex items-center space-x-1 text-gray-500">
                            {getTypeIcon(report.type)}
                            <span className="text-xs">{report.type}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{report.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>By {report.author}</span>
                          <span>{report.date}</span>
                          <span>{report.fileSize}</span>
                          <span>{report.downloads} downloads</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-8 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reports</p>
                      <p className="text-3xl font-semibold text-gray-900">152</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-sm text-green-600 mt-2">+12% from last month</p>
                </div>
                
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Downloads</p>
                      <p className="text-3xl font-semibold text-gray-900">1,247</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Download className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">+8% from last month</p>
                </div>
                
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Authors</p>
                      <p className="text-3xl font-semibold text-gray-900">24</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-purple-600 mt-2">+2 new this month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;