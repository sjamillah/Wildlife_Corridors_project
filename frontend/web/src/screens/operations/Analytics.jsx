import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Download, Users, AlertTriangle, CheckCircle, Eye, Clock, BarChart, TrendingUp, Heart, Shield } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('wildlife');
  const navigate = useNavigate();

  // Sample analytics data
  const [analyticsData, setAnalyticsData] = useState({
    wildlife: {
      totalAnimals: 156,
      activeTracking: 142,
      healthAlerts: 8,
      lowBattery: 12,
      speciesBreakdown: [
        { name: 'African Elephants', count: 45, percentage: 28.8, trend: '+3 new collars' },
        { name: 'Reticulated Giraffes', count: 32, percentage: 20.5, trend: '2 births recorded' },
        { name: 'Grevy\'s Zebras', count: 28, percentage: 17.9, trend: 'Population stable' },
        { name: 'African Lions', count: 23, percentage: 14.7, trend: '1 pride relocated' },
        { name: 'Black Rhinos', count: 18, percentage: 11.5, trend: 'Anti-poaching success' }
      ]
    },
    patrols: {
      totalPatrols: 248,
      successRate: 94.3,
      avgDuration: '6.2h',
      incidentsResolved: 186,
      teamPerformance: [
        { team: 'Alpha Team', missions: 52, success: 96.2, incidents: 3 },
        { team: 'Beta Team', missions: 48, success: 93.8, incidents: 5 },
        { team: 'Charlie Team', missions: 61, success: 95.1, incidents: 2 },
        { team: 'Delta Team', missions: 42, success: 92.9, incidents: 4 },
        { team: 'Echo Team', missions: 45, success: 97.8, incidents: 1 }
      ]
    },
    alerts: {
      totalAlerts: 1247,
      resolved: 1183,
      avgResponseTime: '12.4 min',
      criticalAlerts: 23,
      alertTypes: [
        { type: 'Human-Wildlife Conflict', count: 456, percentage: 36.6 },
        { type: 'Equipment Maintenance', count: 298, percentage: 23.9 },
        { type: 'Health Monitoring', count: 187, percentage: 15.0 },
        { type: 'Security Breach', count: 145, percentage: 11.6 },
        { type: 'Environmental', count: 161, percentage: 12.9 }
      ]
    },
    conservation: {
      protectedArea: '2,456 km²',
      biodiversityIndex: 8.7,
      humanWildlifeConflicts: -15.2,
      communityEngagement: 89.4
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  // Simulated real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        ...prev,
        wildlife: {
          ...prev.wildlife,
          activeTracking: prev.wildlife.activeTracking + (Math.random() > 0.5 ? 1 : -1)
        }
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ title, value, change, icon: Icon, color = 'emerald' }) => (
    <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-emerald-500 border-t border-r border-b border-gray-100 enhanced-card">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-14 h-14 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {change && (
          <span className={`text-sm font-semibold ${
            change.startsWith('+') ? 'text-green-600' : change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
          }`}>
            {change}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );

  const chartData = selectedMetric === 'wildlife' ? analyticsData.wildlife.speciesBreakdown :
                   selectedMetric === 'patrols' ? analyticsData.patrols.teamPerformance :
                   analyticsData.alerts.alertTypes;

  return (
    <div className="flex h-screen wildlife-background overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-warm border-b px-8 py-6" style={{fontFamily: 'Inter, system-ui, -apple-system, sans-serif'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart className="w-5 h-5 text-brand-primary" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600 mt-0.5">Conservation insights and performance metrics</p>
              </div>
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
              <button className="px-4 py-2 border border-emerald-200 text-emerald-700 font-medium rounded-xl hover:bg-emerald-50 transition flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Animals Tracked"
                value={analyticsData.wildlife.totalAnimals}
                change="+12%"
                icon={Activity}
                color="emerald"
              />
              <MetricCard
                title="Active Patrols"
                value={analyticsData.patrols.totalPatrols}
                change="+8%"
                icon={Users}
                color="blue"
              />
              <MetricCard
                title="Alerts Resolved"
                value={`${analyticsData.alerts.resolved}/${analyticsData.alerts.totalAlerts}`}
                change="+5%"
                icon={CheckCircle}
                color="green"
              />
              <MetricCard
                title="Response Time"
                value={analyticsData.alerts.avgResponseTime}
                change="-18%"
                icon={Clock}
                color="orange"
              />
            </div>

            {/* Analytics Tabs */}
            <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Detailed Analytics</h2>
                <div className="flex space-x-2">
                  {[
                    { key: 'wildlife', label: 'Wildlife Data', icon: Activity },
                    { key: 'patrols', label: 'Patrol Performance', icon: Users },
                    { key: 'alerts', label: 'Alert Analysis', icon: AlertTriangle }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedMetric(tab.key)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${
                        selectedMetric === tab.key
                          ? 'bg-emerald-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Simulated Chart */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-4">
                    {selectedMetric === 'wildlife' ? 'Species Distribution' :
                     selectedMetric === 'patrols' ? 'Team Performance' :
                     'Alert Categories'}
                  </h3>
                  <div className="space-y-4">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {item.name || item.team || item.type}
                            </span>
                            <span className="text-sm text-gray-600">
                              {selectedMetric === 'wildlife' ? item.count :
                               selectedMetric === 'patrols' ? `${item.success}%` :
                               item.count}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-emerald-600 transition-all"
                              style={{ 
                                width: selectedMetric === 'wildlife' ? `${item.percentage}%` :
                                       selectedMetric === 'patrols' ? `${item.success}%` :
                                       `${item.percentage}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="space-y-4">
                  {selectedMetric === 'wildlife' && (
                    <>
                      <div className="bg-white border-l-4 border-l-emerald-600 border-t border-r border-b border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-2">Active Tracking</p>
                            <p className="text-3xl font-bold text-gray-900">{analyticsData.wildlife.activeTracking}</p>
                          </div>
                          <div className="p-3 bg-emerald-100 rounded-lg">
                            <Eye className="w-8 h-8 text-emerald-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border-l-4 border-l-red-600 border-t border-r border-b border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-2">Health Alerts</p>
                            <p className="text-3xl font-bold text-gray-900">{analyticsData.wildlife.healthAlerts}</p>
                          </div>
                          <div className="p-3 bg-red-100 rounded-lg">
                            <Heart className="w-8 h-8 text-red-600" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {selectedMetric === 'patrols' && (
                    <>
                      <div className="bg-white border-l-4 border-l-green-600 border-t border-r border-b border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-2">Success Rate</p>
                            <p className="text-3xl font-bold text-gray-900">{analyticsData.patrols.successRate}%</p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border-l-4 border-l-blue-600 border-t border-r border-b border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-2">Avg Duration</p>
                            <p className="text-3xl font-bold text-gray-900">{analyticsData.patrols.avgDuration}</p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Clock className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {selectedMetric === 'alerts' && (
                    <>
                      <div className="bg-white border-l-4 border-l-orange-600 border-t border-r border-b border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-2">Critical Alerts</p>
                            <p className="text-3xl font-bold text-gray-900">{analyticsData.alerts.criticalAlerts}</p>
                          </div>
                          <div className="p-3 bg-orange-100 rounded-lg">
                            <Shield className="w-8 h-8 text-orange-600" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border-l-4 border-l-emerald-600 border-t border-r border-b border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-2">Resolution Rate</p>
                            <p className="text-3xl font-bold text-gray-900">{((analyticsData.alerts.resolved / analyticsData.alerts.totalAlerts) * 100).toFixed(1)}%</p>
                          </div>
                          <div className="p-3 bg-emerald-100 rounded-lg">
                            <BarChart className="w-8 h-8 text-emerald-600" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Conservation Impact Metrics */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Conservation Impact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">{analyticsData.conservation.protectedArea}</div>
                  <p className="text-sm text-gray-600">Protected Area</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{analyticsData.conservation.biodiversityIndex}/10</div>
                  <p className="text-sm text-gray-600">Biodiversity Index</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{analyticsData.conservation.humanWildlifeConflicts}%</div>
                  <p className="text-sm text-gray-600">Conflict Reduction</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{analyticsData.conservation.communityEngagement}%</div>
                  <p className="text-sm text-gray-600">Community Engagement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;