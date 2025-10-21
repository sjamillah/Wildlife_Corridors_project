import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, Filter, Search, TrendingUp, Users, Activity, AlertTriangle, Eye, Clock, BarChart, MapPin } from '@/components/shared/Icons';
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
        downloads: 156,
        location: { lat: -1.2921, lng: 36.8219, area: 'Nairobi National Park' },
        species: 'elephant',
        riskLevel: 'medium'
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
        downloads: 89,
        location: { lat: -2.1540, lng: 37.9083, area: 'Amboseli Ecosystem' },
        species: 'elephant',
        riskLevel: 'high'
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
        downloads: 23,
        location: { lat: -1.5678, lng: 36.0582, area: 'Maasai Mara Reserve' },
        species: 'wildebeest',
        riskLevel: 'low'
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
        downloads: 67,
        location: { lat: -1.4518, lng: 36.9560, area: 'Kajiado County' },
        species: 'patrol',
        riskLevel: 'medium'
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
        downloads: 134,
        location: { lat: -0.0917, lng: 37.9062, area: 'Laikipia Plateau' },
        species: 'patrol',
        riskLevel: 'high'
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
        downloads: 78,
        location: { lat: -0.7893, lng: 37.0184, area: 'Nyeri County' },
        species: 'alert',
        riskLevel: 'high'
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
        downloads: 92,
        location: { lat: -1.8707, lng: 37.3560, area: 'Tsavo East National Park' },
        species: 'wildlife',
        riskLevel: 'low'
      }
    ]
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-brand-success border border-brand-success/40 text-brand-text';
      case 'draft': return 'bg-brand-warning border border-brand-warning/40 text-brand-text-secondary';
      case 'pending': return 'bg-brand-info border border-brand-info/40 text-brand-text';
      default: return 'bg-brand-card border border-brand-card/40 text-brand-text-secondary';
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
                className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 bg-white focus:ring-2 focus:ring-brand-secondary focus:border-brand-accent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>
              <button className="px-5 py-2.5 bg-brand-primary hover:bg-brand-highlight text-white font-semibold rounded-xl transition flex items-center space-x-2">
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
                      ? 'border-2 border-brand-primary bg-brand-card'
                      : 'border-brand-card bg-brand-card hover:border-brand-primary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedReport === category.id ? 'bg-brand-primary' : 'bg-brand-secondary/20'
                    }`}>
                      <category.icon className={`w-6 h-6 ${
                        selectedReport === category.id ? 'text-white' : 'text-brand-primary'
                      }`} />
                    </div>
                    <span className={`text-2xl font-bold ${
                      selectedReport === category.id ? 'text-brand-primary' : 'text-brand-text'
                    }`}>
                      {category.count}
                    </span>
                  </div>
                  <h3 className={`font-semibold ${
                    selectedReport === category.id ? 'text-brand-text' : 'text-brand-text-secondary'
                  }`}>
                    {category.label}
                  </h3>
                </button>
              ))}
            </div>

            {/* Report Analytics Dashboard */}
            <div className="bg-white rounded-xl p-8 mb-8 border border-gray-100 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <BarChart className="w-5 h-5 text-brand-primary" />
                    <span>Report Analytics</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Statistical overview of {reportCategories.find(cat => cat.id === selectedReport)?.label.toLowerCase()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Reports */}
                <div className="bg-brand-card rounded-lg p-6 border border-brand-card">
                  <div className="flex items-center justify-between mb-3">
                    <FileText className="w-8 h-8 text-brand-primary" />
                    <span className="text-xs font-medium text-brand-text bg-brand-secondary/20 px-2 py-1 rounded-full">Total</span>
                  </div>
                  <div className="text-3xl font-bold text-brand-primary">{reports[selectedReport].length}</div>
                  <div className="text-sm text-brand-text font-medium">Active Reports</div>
                </div>

                {/* Completed Reports */}
                <div className="bg-brand-success/10 rounded-lg p-6 border border-brand-success/20">
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="w-8 h-8 text-brand-success" />
                    <span className="text-xs font-medium text-brand-success bg-brand-success/10 px-2 py-1 rounded-full">Status</span>
                  </div>
                  <div className="text-3xl font-bold text-brand-success">
                    {reports[selectedReport].filter(r => r.status === 'completed').length}
                  </div>
                  <div className="text-sm text-brand-success font-medium">Completed</div>
                </div>

                {/* Average Size */}
                <div className="bg-brand-warning/10 rounded-lg p-6 border border-brand-warning/20">
                  <div className="flex items-center justify-between mb-3">
                    <Download className="w-8 h-8 text-brand-warning" />
                    <span className="text-xs font-medium text-brand-warning bg-brand-warning/10 px-2 py-1 rounded-full">Size</span>
                  </div>
                  <div className="text-3xl font-bold text-brand-warning">
                    {(reports[selectedReport].reduce((acc, r) => acc + parseFloat(r.fileSize), 0) / reports[selectedReport].length).toFixed(1)}MB
                  </div>
                  <div className="text-sm text-brand-warning font-medium">Avg Size</div>
                </div>

                {/* Total Downloads */}
                <div className="bg-brand-info/10 rounded-lg p-6 border border-brand-info/20">
                  <div className="flex items-center justify-between mb-3">
                    <Users className="w-8 h-8 text-brand-info" />
                    <span className="text-xs font-medium text-brand-info bg-brand-info/10 px-2 py-1 rounded-full">Usage</span>
                  </div>
                  <div className="text-3xl font-bold text-brand-info">
                    {reports[selectedReport].reduce((acc, r) => acc + r.downloads, 0)}
                  </div>
                  <div className="text-sm text-brand-info font-medium">Total Downloads</div>
                </div>
              </div>

              {/* Report Timeline */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Activity Timeline</h4>
                <div className="space-y-4">
                  {reports[selectedReport].slice(0, 3).map((report) => (
                    <div key={report.id} className="flex items-start space-x-4 p-4 bg-brand-card/40 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        report.status === 'completed' ? 'bg-brand-success/20 text-brand-success' :
                        report.status === 'draft' ? 'bg-brand-warning/20 text-brand-warning' :
                        'bg-brand-info/20 text-brand-info'
                      }`}>
                        {getTypeIcon(report.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-semibold text-brand-text">{report.title}</h5>
                          <span className="text-xs text-brand-text-secondary">{report.date}</span>
                        </div>
                        <p className="text-sm text-brand-text-secondary mb-2">{report.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-brand-text-secondary">
                          <span>By {report.author}</span>
                          <span>{report.fileSize}</span>
                          <span>{report.downloads} downloads</span>
                          <span className="text-brand-primary font-medium">{report.location.area}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-brand-accent"
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
                  <div key={report.id} className="border border-brand-card/40 rounded-lg p-6 hover:shadow-md transition-shadow bg-brand-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-brand-text">{report.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <div className="flex items-center space-x-1 text-brand-text-secondary">
                            {getTypeIcon(report.type)}
                            <span className="text-xs">{report.type}</span>
                          </div>
                        </div>
                        <p className="text-brand-text-secondary mb-3">{report.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-brand-text-secondary mb-2">
                          <span>By {report.author}</span>
                          <span>{report.date}</span>
                          <span>{report.fileSize}</span>
                          <span>{report.downloads} downloads</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{report.location.area}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            report.riskLevel === 'low' ? 'bg-brand-secondary/10 text-brand-secondary' :
                            report.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {report.riskLevel} risk
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg transition flex items-center space-x-2">
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
            <div className="bg-gradient-to-r from-brand-primary to-brand-highlight px-6 py-8 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reports</p>
                      <p className="text-3xl font-semibold text-gray-900">152</p>
                    </div>
                    <div className="p-3 bg-brand-primary/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-brand-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-brand-primary mt-2">+12% from last month</p>
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