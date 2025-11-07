import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Download, Users, CheckCircle, Clock } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { COLORS, rgba } from '../../constants/Colors';
import { rangers, animals, auth } from '../../services';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const [selectedMetric] = useState('wildlife');
  const [viewTab, setViewTab] = useState('7d');
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();

  // Sample analytics data
  const [analyticsData, setAnalyticsData] = useState({
    wildlife: {
      totalAnimals: 347,
      activeTracking: 334,
      healthAlerts: 8,
      lowBattery: 12,
      speciesBreakdown: [
        { name: 'Wildebeests', count: 258, percentage: 74.4 },
        { name: 'African Elephants', count: 89, percentage: 25.6 }
      ]
    },
    patrols: {
      totalPatrols: 248,
      successRate: 94.3,
      avgDuration: '6.2h',
      incidentsResolved: 186
    },
    alerts: {
      totalAlerts: 1247,
      resolved: 1183,
      avgResponseTime: '12.4 min',
      criticalAlerts: 23
    }
  });

  // Threat assessment data
  const threats = [
    {
      id: 1,
      name: 'Kimana Corridor',
      level: 'Critical',
      incidents: 3,
      passageBlocked: 72,
      riskScore: 8.9
    },
    {
      id: 2,
      name: 'Mara-Serengeti Route',
      level: 'High',
      incidents: 2,
      passageBlocked: 45,
      riskScore: 7.2
    },
    {
      id: 3,
      name: 'Tarangire Crossing',
      level: 'Medium',
      incidents: 1,
      passageBlocked: 28,
      riskScore: 5.4
    },
    {
      id: 4,
      name: 'Amboseli Corridor',
      level: 'Safe',
      incidents: 0,
      passageBlocked: 12,
      riskScore: 2.1
    }
  ];

  // Conservation impact data
  const conservationImpact = [
    { label: 'Animals Tracked', value: '1,247', color: COLORS.burntOrange },
    { label: 'Patrol Missions', value: '892', color: COLORS.forestGreen },
    { label: 'Alerts Resolved', value: '1,183', color: COLORS.info },
    { label: 'Community Engaged', value: '89%', color: COLORS.success }
  ];

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      navigate('/auth', { replace: true });
    }
  };

  // Generate chart data for the last 7 days
  const generateChartData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map((day, index) => ({
      name: day,
      animals: Math.floor(Math.random() * 50) + 280, // Will be replaced with real data
      alerts: Math.floor(Math.random() * 20) + 5,
      patrols: Math.floor(Math.random() * 15) + 10,
    }));
    setChartData(data);
  };

  // Fetch real analytics data
  useEffect(() => {
    generateChartData();
    
    const fetchAnalytics = async () => {
      try {
        const logsData = await rangers.logs.getAll({ days: 7 });
        const logs = logsData.results || logsData || [];
        
        const animalsData = await animals.getLiveStatus();
        const animalsList = animalsData.results || animalsData || [];

        setAnalyticsData({
        wildlife: {
            totalAnimals: animalsList.length,
            activeTracking: animalsList.filter(a => a.status === 'active').length,
            healthAlerts: animalsList.filter(a => a.risk_level === 'High').length,
            lowBattery: animalsList.filter(a => a.battery < 30).length,
            speciesBreakdown: [
              { name: 'Elephants', count: animalsList.filter(a => a.species === 'elephant').length, percentage: 0 },
              { name: 'Wildebeest', count: animalsList.filter(a => a.species === 'wildebeest').length, percentage: 0 }
            ]
          },
          patrols: {
            totalPatrols: logs.filter(l => l.log_type === 'patrol_start').length,
            successRate: 94.3,
            avgDuration: '6.2h',
            incidentsResolved: logs.filter(l => l.log_type === 'emergency' && l.is_resolved).length
          },
          alerts: {
            totalAlerts: logs.length,
            resolved: logs.filter(l => l.is_resolved).length,
            avgResponseTime: '12.4 min',
            criticalAlerts: logs.filter(l => l.priority === 'critical').length
        }
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExportReport = () => {
    const reportData = {
      generated: new Date().toISOString(),
      analytics_data: analyticsData,
      threats: threats,
      conservation_impact: conservationImpact
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wildlife-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getThreatColor = (level) => {
    switch (level) {
      case 'Critical': return COLORS.error;
      case 'High': return COLORS.ochre;
      case 'Medium': return COLORS.info;
      default: return COLORS.success;
    }
  };

  const getThreatBg = (level) => {
    switch (level) {
      case 'Critical': return COLORS.tintCritical;
      case 'High': return COLORS.tintWarning;
      case 'Medium': return rgba('statusInfo', 0.1);
      default: return COLORS.tintSuccess;
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div style={{ marginLeft: '260px', minHeight: '100vh' }}>
        {/* Page Header */}
        <section style={{ background: COLORS.forestGreen, padding: '28px 40px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: COLORS.white, marginBottom: '6px', letterSpacing: '-0.6px' }}>
              Analytics Dashboard
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Conservation insights & data visualization
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Live indicator */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: COLORS.white, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.success, animation: 'pulse 2s ease-in-out infinite' }}></div>
              Live
            </div>
            {/* Export button */}
                    <button
              onClick={handleExportReport}
              style={{
                background: COLORS.burntOrange,
                border: `2px solid ${COLORS.burntOrange}`,
                color: COLORS.white,
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; e.currentTarget.style.borderColor = COLORS.terracotta; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; e.currentTarget.style.borderColor = COLORS.burntOrange; }}
            >
              <Download className="w-4 h-4" />
              Export Report
                    </button>
                </div>
        </section>

        {/* Key Metrics Bar */}
        <section style={{ background: COLORS.secondaryBg, padding: '28px 40px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {/* Animals Tracked */}
            <div style={{
              background: COLORS.whiteCard,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderMedium;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderLight;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.tintRangers }}>
                <Activity className="w-6 h-6" style={{ color: COLORS.textPrimary }} />
                </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1, marginBottom: '4px' }}>
                  {analyticsData.wildlife.totalAnimals}
              </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '4px' }}>
                  Animals Tracked
                          </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.success, marginTop: '4px' }}>
                  ↑ +12%
                          </div>
                  </div>
                </div>

            {/* Active Patrols */}
            <div style={{
              background: COLORS.whiteCard,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderMedium;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderLight;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: rgba('statusInfo', 0.1) }}>
                <Users className="w-6 h-6" style={{ color: COLORS.textPrimary }} />
                          </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1, marginBottom: '4px' }}>
                  {analyticsData.patrols.totalPatrols}
                          </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '4px' }}>
                  Active Patrols
                        </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.success, marginTop: '4px' }}>
                  ↑ +8%
                          </div>
                        </div>
                      </div>

            {/* Alerts Resolved */}
            <div style={{
              background: COLORS.whiteCard,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderMedium;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderLight;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.tintCritical }}>
                <CheckCircle className="w-6 h-6" style={{ color: COLORS.textPrimary }} />
                          </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1, marginBottom: '4px' }}>
                  {analyticsData.alerts.resolved}
                          </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '4px' }}>
                  Alerts Resolved
                        </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.success, marginTop: '4px' }}>
                  ↑ +5%
                          </div>
                        </div>
                      </div>

            {/* Avg Response Time */}
            <div style={{
              background: COLORS.whiteCard,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderMedium;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.borderLight;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.tintWarning }}>
                <Clock className="w-6 h-6" style={{ color: COLORS.textPrimary }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1, marginBottom: '4px' }}>
                  {analyticsData.alerts.avgResponseTime}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary, marginBottom: '4px' }}>
                  Avg Response Time
                          </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: COLORS.success, marginTop: '4px' }}>
                  ↓ -18%
                          </div>
                        </div>
                      </div>
                          </div>
        </section>

        {/* Analytics Section */}
        <section style={{ padding: '32px 40px' }}>
          {/* Analytics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Chart Card */}
            <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary }}>
                  Wildlife Tracking Trends
                </h3>
                {/* View Tabs */}
                <div style={{ display: 'flex', gap: '4px', background: COLORS.creamBg, padding: '4px', borderRadius: '6px' }}>
                  {['7d', '30d', '90d', '1y'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setViewTab(tab)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        background: viewTab === tab ? COLORS.whiteCard : 'transparent',
                        color: viewTab === tab ? COLORS.textPrimary : COLORS.textSecondary,
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                          </div>
                        </div>
              {/* Interactive Chart using Recharts */}
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAnimals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.forestGreen} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.forestGreen} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.burntOrange} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.burntOrange} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
                  <XAxis 
                    dataKey="name" 
                    stroke={COLORS.textSecondary}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                  <YAxis 
                    stroke={COLORS.textSecondary}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.whiteCard, 
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '13px', fontWeight: 600 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="animals" 
                    stroke={COLORS.forestGreen} 
                    fillOpacity={1} 
                    fill="url(#colorAnimals)"
                    strokeWidth={2}
                    name="Animals Tracked"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="alerts" 
                    stroke={COLORS.burntOrange} 
                    fillOpacity={1} 
                    fill="url(#colorAlerts)"
                    strokeWidth={2}
                    name="Alerts"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Right Side - Species Distribution / Tracking Overview */}
            {selectedMetric === 'wildlife' ? (
              /* Species Distribution Card */
              <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
                  Species Distribution
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analyticsData.wildlife.speciesBreakdown.map((species, idx) => {
                    const colors = [COLORS.burntOrange, COLORS.forestGreen, COLORS.ochre, COLORS.info];
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.textPrimary }}>
                            {species.name}
                </div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: COLORS.textSecondary }}>
                            {species.count}
                </div>
              </div>
                        <div style={{ height: '10px', background: COLORS.creamBg, borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${species.percentage}%`,
                            background: colors[idx % colors.length],
                            borderRadius: '5px',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        </div>
                    );
                  })}
                        </div>
                      </div>
            ) : (
              /* Tracking Overview Card */
              <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
                  Tracking Overview
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: `1px solid ${COLORS.creamBg}` }}>
                    <div style={{ fontSize: '13px', color: COLORS.textSecondary, fontWeight: 500 }}>
                      Active Tracking
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: COLORS.textPrimary }}>
                      {analyticsData.wildlife.activeTracking}
                      </div>
                    </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: `1px solid ${COLORS.creamBg}` }}>
                    <div style={{ fontSize: '13px', color: COLORS.textSecondary, fontWeight: 500 }}>
                      Health Alerts
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: COLORS.textPrimary }}>
                      {analyticsData.wildlife.healthAlerts}
                  </div>
                </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: `1px solid ${COLORS.creamBg}` }}>
                    <div style={{ fontSize: '13px', color: COLORS.textSecondary, fontWeight: 500 }}>
                      Low Battery
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: COLORS.textPrimary }}>
                      {analyticsData.wildlife.lowBattery}
                      </div>
                    </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: COLORS.textSecondary, fontWeight: 500 }}>
                      Total Tracked
                  </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: COLORS.textPrimary }}>
                      {analyticsData.wildlife.totalAnimals}
                      </div>
                    </div>
                  </div>
                    </div>
            )}
                      </div>

          {/* Threat Assessment Section */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
              Threat Assessment
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {threats.map((threat) => {
                const threatColor = getThreatColor(threat.level);
                const threatBg = getThreatBg(threat.level);

                return (
                  <div key={threat.id} style={{
                    background: COLORS.whiteCard,
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: '10px',
                    padding: '20px',
                    position: 'relative'
                  }}>
                    {/* Top Accent */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      borderRadius: '10px 10px 0 0',
                      background: threatColor
                    }}></div>

                    {/* Threat Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '4px' }}>
                        {threat.name}
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: threatBg,
                        color: threatColor
                      }}>
                        {threat.level}
                      </span>
                  </div>

                    {/* Threat Metrics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ color: COLORS.textSecondary }}>Incidents</span>
                        <span style={{ fontWeight: 700, color: threat.level === 'Critical' || threat.level === 'High' ? COLORS.error : threat.level === 'Medium' ? COLORS.ochre : COLORS.success }}>
                          {threat.incidents}
                        </span>
                    </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ color: COLORS.textSecondary }}>Passage Blocked</span>
                        <span style={{ fontWeight: 700, color: threat.level === 'Critical' || threat.level === 'High' ? COLORS.error : threat.level === 'Medium' ? COLORS.ochre : COLORS.success }}>
                          {threat.passageBlocked}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ color: COLORS.textSecondary }}>Risk Score</span>
                        <span style={{ fontWeight: 700, color: threat.level === 'Critical' || threat.level === 'High' ? COLORS.error : threat.level === 'Medium' ? COLORS.ochre : COLORS.success }}>
                          {threat.riskScore}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

          {/* Conservation Impact Section */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
              Conservation Impact
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {conservationImpact.map((impact, idx) => (
                <div key={idx} style={{
                  background: COLORS.whiteCard,
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '10px',
                  padding: '28px 24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', color: impact.color }}>
                    {impact.value}
                </div>
                  <div style={{ fontSize: '13px', color: COLORS.textSecondary, fontWeight: 500 }}>
                    {impact.label}
                </div>
              </div>
              ))}
        </div>
      </div>
        </section>
      </div>

      {/* Add pulse animation CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Analytics;
