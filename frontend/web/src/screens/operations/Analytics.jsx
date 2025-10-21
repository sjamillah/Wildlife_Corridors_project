import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Download, Users, AlertTriangle, CheckCircle, Eye, Clock, BarChart, TrendingUp, Heart, Shield } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { AnalyticsHeader } from '../../components/shared/HeaderVariants';
import MapComponent from '../../components/shared/MapComponent';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveCard, ResponsiveText, ResponsiveButton } from '../../components/shared/ResponsiveContainer';

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('wildlife');
  const navigate = useNavigate();

  // Threat assessment map data
  const threatAssessmentData = {
    center: [-2.5, 36.0], // Central Kenya/Tanzania wildlife corridor region
    zoom: 7,
    markers: [
      {
        id: 'kimana-amboseli-threat',
        position: [-2.6, 37.3],
        type: 'alert',
        title: 'Kimana-Amboseli Corridor - CRITICAL',
        description: 'Active poaching incidents detected. 3 snares removed. Wildlife passage 72% blocked.',
        color: '#6b7280'
      },
      {
        id: 'mara-serengeti-threat',
        position: [-1.4, 35.0],
        type: 'alert', 
        title: 'Mara-Serengeti Corridor - HIGH',
        description: 'Human encroachment in 2 zones. Wildlife passage 45% restricted.',
        color: '#6b7280'
      },
      {
        id: 'tarangire-manyara-threat',
        position: [-3.8, 36.0],
        type: 'alert',
        title: 'Tarangire-Manyara Corridor - MEDIUM', 
        description: 'Traffic barrier issues. Road crossings need improvement.',
        color: '#6b7280'
      },
      {
        id: 'amboseli-tsavo-safe',
        position: [-2.8, 37.8],
        type: 'wildlife',
        title: 'Amboseli-Tsavo Corridor - SAFE',
        description: 'Normal wildlife movement. No current threats detected.',
        color: '#4b5563'
      },
      {
        id: 'patrol-station-1',
        position: [-2.4, 36.8],
        type: 'patrol',
        title: 'Anti-Poaching Patrol Base',
        description: 'Active patrol station monitoring Kimana-Amboseli corridor.',
        color: '#374151'
      },
      {
        id: 'patrol-station-2', 
        position: [-1.6, 35.2],
        type: 'patrol',
        title: 'Mara Conservation Unit',
        description: 'Patrol unit responding to encroachment threats.',
        color: '#374151'
      }
    ],
    corridors: [
      {
        id: 'kimana-amboseli',
        path: [[-2.6, 37.2], [-2.7, 37.4], [-2.5, 37.5]]
      },
      {
        id: 'mara-serengeti', 
        path: [[-1.3, 34.8], [-1.5, 35.1], [-1.2, 35.3]]
      },
      {
        id: 'tarangire-manyara',
        path: [[-3.7, 35.8], [-3.9, 36.1], [-3.6, 36.2]]
      },
      {
        id: 'amboseli-tsavo',
        path: [[-2.7, 37.7], [-2.9, 37.9], [-2.6, 38.0]]
      }
    ]
  };

  // Sample analytics data
  const [analyticsData, setAnalyticsData] = useState({
    wildlife: {
      totalAnimals: 347,
      activeTracking: 334,
      healthAlerts: 8,
      lowBattery: 12,
      speciesBreakdown: [
        { name: 'Wildebeests', count: 258, percentage: 74.4, trend: 'Migration season peak' },
        { name: 'African Elephants', count: 89, percentage: 25.6, trend: 'Stable family groups' }
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

  const handleRefresh = () => {
    console.log('Refreshing analytics data...');
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

  const MetricCard = ({ title, value, change, icon: Icon, color = 'brand' }) => (
    <ResponsiveCard variant="elevated" className="border-l-4 border-l-brand-primary animate-fade-in">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-brand-primary flex items-center justify-center shadow-md">
          <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </div>
        {change && (
          <span className={`text-xs sm:text-sm font-semibold ${
            change.startsWith('+') ? 'text-brand-primary' : change.startsWith('-') ? 'text-status-error' : 'text-brand-text-secondary'
          }`}>
            {change}
          </span>
        )}
      </div>
      <ResponsiveText size="2xl" weight="bold" className="mb-1">{value}</ResponsiveText>
      <ResponsiveText size="sm" color="secondary">{title}</ResponsiveText>
    </ResponsiveCard>
  );

  const chartData = selectedMetric === 'wildlife' ? analyticsData.wildlife.speciesBreakdown :
                   selectedMetric === 'patrols' ? analyticsData.patrols.teamPerformance :
                   analyticsData.alerts.alertTypes;

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnalyticsHeader metrics={analyticsData} onRefresh={handleRefresh} />

        <div className="flex-1 overflow-y-auto">
          <ResponsiveContainer>
            {/* Key Metrics Grid */}
            <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap="default" className="mb-6 sm:mb-8">
              <MetricCard
                title="Animals Tracked"
                value={analyticsData.wildlife.totalAnimals}
                change="+12%"
                icon={Activity}
                color="brand"
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
                color="var(--brand-primary)"
              />
              <MetricCard
                title="Response Time"
                value={analyticsData.alerts.avgResponseTime}
                change="-18%"
                icon={Clock}
                color="orange"
              />
            </ResponsiveGrid>

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
                          ? 'bg-brand-primary text-white'
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
                <div className="bg-brand-secondary rounded-xl p-6 border border-brand-accent">
                  <h3 className="text-sm font-bold text-brand-text uppercase tracking-wide mb-4">
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
                              className="h-2 rounded-full bg-brand-primary transition-all"
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
                      <div className="bg-white border-l-4 border-l-brand-primary border-t border-r border-b border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-2">Active Tracking</p>
                            <p className="text-3xl font-bold text-gray-900">{analyticsData.wildlife.activeTracking}</p>
                          </div>
                          <div className="p-3 bg-brand-secondary rounded-lg">
                            <Eye className="w-8 h-8 text-brand-primary" />
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
                      <div className="bg-white border-l-4 border-l-brand-primary border-t border-r border-b border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-2">Success Rate</p>
                            <p className="text-3xl font-bold text-gray-900">{analyticsData.patrols.successRate}%</p>
                          </div>
                          <div className="p-3 bg-brand-secondary rounded-lg">
                            <TrendingUp className="w-8 h-8 text-brand-primary" />
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
                      <div className="bg-white border-l-4 border-l-brand-primary border-t border-r border-b border-gray-100 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium mb-2">Resolution Rate</p>
                            <p className="text-3xl font-bold text-gray-900">{((analyticsData.alerts.resolved / analyticsData.alerts.totalAlerts) * 100).toFixed(1)}%</p>
                          </div>
                          <div className="p-3 bg-brand-secondary rounded-lg">
                            <BarChart className="w-8 h-8 text-brand-primary" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Wildlife Corridor Threat Assessment */}
            <div className="bg-white rounded-2xl p-8 mb-8 border border-gray-100 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Wildlife Corridor Threat Assessment</h2>
                  <p className="text-sm text-gray-600">Real-time threat analysis across critical migration routes</p>
                </div>
                <div className="flex items-center space-x-2 bg-brand-secondary px-3 py-2 rounded-full border border-brand-accent">
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-brand-text">Live Monitoring</span>
                </div>
              </div>
              
              {/* Corridor Threat Map */}
              <div className="space-y-6">
                {/* Interactive Threat Map - Increased Vertical Size */}
                <div className="w-full">
                  <div className="relative w-full h-[500px] rounded-2xl border-2 border-gray-200 overflow-hidden shadow-lg">
                    <MapComponent
                      center={threatAssessmentData.center}
                      zoom={threatAssessmentData.zoom}
                      markers={threatAssessmentData.markers}
                      patrolRoutes={threatAssessmentData.corridors.map(corridor => corridor.path)}
                      height="500px"
                      className="w-full h-full rounded-2xl"
                      showCoordinates={false}
                      hideControls={true}
                      hideLegend={true}
                      hideMapInfo={true}
                    />
                    
                    {/* Simplified Map Legend */}
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Wildlife Corridors</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-gray-600">Threat Areas</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                          <span className="text-gray-600">Safe Corridors</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-700 rounded-full"></div>
                          <span className="text-gray-600">Patrol Stations</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Real-time indicator */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-gray-700">Live Data</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Corridor Status Panel - Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-brand-secondary rounded-xl p-4 border border-brand-accent shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">Kimana-Amboseli</h4>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">CRITICAL</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Poaching incidents:</span>
                        <span className="font-semibold text-red-600">3 active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wildlife passage:</span>
                        <span className="font-semibold text-red-600">72% blocked</span>
                      </div>
                      <div className="mt-3 text-xs text-red-600">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Immediate intervention required
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-secondary rounded-xl p-4 border border-brand-accent shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">Mara-Serengeti</h4>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">HIGH</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Human encroachment:</span>
                        <span className="font-semibold text-orange-600">2 zones</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wildlife passage:</span>
                        <span className="font-semibold text-orange-600">45% restricted</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-secondary rounded-xl p-4 border border-brand-accent shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">Tarangire-Manyara</h4>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">MEDIUM</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wildlife passage:</span>
                        <span className="font-semibold text-yellow-600">92% open</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patrol coverage:</span>
                        <span className="font-semibold text-yellow-600">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-secondary rounded-xl p-4 border border-brand-accent shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">Amboseli-Tsavo</h4>
                      <span className="px-2 py-1 bg-brand-secondary text-brand-text text-xs rounded-full font-medium">SAFE</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Wildlife passage:</span>
                        <span className="font-semibold text-brand-primary">88% open</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Water access:</span>
                        <span className="font-semibold text-brand-primary">Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conservation Impact Metrics */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Conservation Impact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-primary mb-2">{analyticsData.conservation.protectedArea}</div>
                  <p className="text-sm text-gray-600">Protected Area</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-primary mb-2">{analyticsData.conservation.biodiversityIndex}/10</div>
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
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;