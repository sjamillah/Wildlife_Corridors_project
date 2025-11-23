import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Download, Users, CheckCircle, Clock } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { COLORS, rgba } from '../../constants/Colors';
import { rangers, animals, auth, conflictZones, corridors, alerts } from '../../services';
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const Analytics = () => {
  const [selectedMetric] = useState('wildlife');
  const [viewTab, setViewTab] = useState('7d');
  const [chartData, setChartData] = useState([]);
  const [conflictScoreData, setConflictScoreData] = useState([]);
  const [alertBreakdownData, setAlertBreakdownData] = useState([]);
  const [corridorHealthData, setCorridorHealthData] = useState([]);
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

  // Threat assessment data - will be fetched from API
  const [threats, setThreats] = useState([]);
  const [conservationImpact, setConservationImpact] = useState([]);

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

  // Fetch chart data from API for the last 7 days
  const generateChartData = useCallback(async () => {
    try {
      // Calculate date range for last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const [animalsData, alertsData, patrolsData] = await Promise.all([
        animals.getAll({ status: 'active' }).catch(() => ({ results: [] })),
        alerts.getAll().catch(() => ({ results: [] })),
        rangers.teams.getAll().catch(() => ({ results: [] }))
      ]);
      
      const allAnimals = animalsData.results || animalsData || [];
      const allAlerts = alertsData.results || alertsData || [];
      const allPatrols = patrolsData.results || patrolsData || [];
      
      // Group data by day for the last 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const chartData = days.map((day, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        const dateStr = date.toISOString().split('T')[0];
        
        // Count animals active on this day
        const dayAnimals = allAnimals.filter(a => {
          const animalDate = new Date(a.last_updated || a.created_at || date);
          return animalDate.toISOString().split('T')[0] === dateStr;
        });
        
        // Count alerts created on this day
        const dayAlerts = allAlerts.filter(a => {
          const alertDate = new Date(a.created_at || a.detected_at || date);
          return alertDate.toISOString().split('T')[0] === dateStr;
        });
        
        // Count patrols on this day
        const dayPatrols = allPatrols.filter(p => {
          const patrolDate = new Date(p.created_at || p.timestamp || date);
          return patrolDate.toISOString().split('T')[0] === dateStr;
        });
        
        // Calculate conflict score based on alerts
        const conflictScore = Math.min(100, (dayAlerts.filter(a => a.severity === 'critical').length * 10) + 
                                             (dayAlerts.filter(a => a.severity === 'high').length * 5) + 
                                             (dayAlerts.length * 2));
        
        return {
      name: day,
          animals: dayAnimals.length || 0,
          alerts: dayAlerts.length || 0,
          patrols: dayPatrols.length || 0,
          conflictScore: conflictScore || 0
        };
      });
      
      setChartData(chartData);
    } catch (error) {
      console.error('Failed to generate chart data:', error);
      // Fallback to empty data
      setChartData([]);
    }
  }, []);

  // Generate conflict score data by corridor
  const generateConflictScoreData = useCallback(async () => {
    try {
      // Fetch conflict zones and ALL corridors (no status filter)
      const [zonesData, corridorsData] = await Promise.all([
        conflictZones.getActive().catch(() => ({ results: [] })),
        corridors.getAll().catch(() => ({ results: [] })) // Fetch ALL corridors from database
      ]);

      const zones = zonesData.results || zonesData || [];
      const corridorsList = corridorsData.results || corridorsData || [];

      console.log(`📊 Conflict Score: Fetched ${corridorsList.length} corridors from database (all corridors, not just active)`);

      // Calculate conflict scores for each corridor
      const conflictScores = corridorsList.map(corridor => {
        // Find conflict zones near this corridor
        const nearbyZones = zones.filter(zone => {
          // Simple proximity check (can be enhanced)
          return zone.zone_type && zone.risk_level;
        });

        // Calculate conflict score based on:
        // - Number of nearby conflict zones
        // - Risk levels of zones
        // - Buffer distance
        let score = 0;
        nearbyZones.forEach(zone => {
          const riskMultiplier = zone.risk_level === 'high' ? 3 : zone.risk_level === 'medium' ? 2 : 1;
          score += riskMultiplier * (zone.buffer_distance_km || 5);
        });

        // Normalize score (0-10 scale)
        const normalizedScore = Math.min(10, Math.max(0, score / 10));

        return {
          name: corridor.name || 'Unknown Corridor',
          conflictScore: parseFloat(normalizedScore.toFixed(1)),
          incidents: nearbyZones.length,
          riskLevel: normalizedScore >= 7 ? 'Critical' : normalizedScore >= 4 ? 'High' : normalizedScore >= 2 ? 'Medium' : 'Low',
          zones: nearbyZones.length
        };
      });

      // Sort by conflict score (highest first)
      conflictScores.sort((a, b) => b.conflictScore - a.conflictScore);
      setConflictScoreData(conflictScores);
    } catch (error) {
      console.error('Failed to generate conflict score data:', error);
      // Fallback to threats data
      const fallbackData = threats.map(t => ({
        name: t.name,
        conflictScore: t.riskScore,
        incidents: t.incidents,
        riskLevel: t.level,
        zones: 0
      }));
      setConflictScoreData(fallbackData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate alert breakdown data
  const generateAlertBreakdownData = useCallback(async () => {
    try {
      const alertsData = await animals.getLiveStatus().catch(() => ({ results: [] }));
      const animalsList = alertsData.results || alertsData || [];

      const breakdown = {
        critical: animalsList.filter(a => a.risk_level === 'Critical' || a.risk_level === 'critical').length,
        high: animalsList.filter(a => a.risk_level === 'High' || a.risk_level === 'high').length,
        medium: animalsList.filter(a => a.risk_level === 'Medium' || a.risk_level === 'medium').length,
        low: animalsList.filter(a => a.risk_level === 'Low' || a.risk_level === 'low' || !a.risk_level).length
      };

      // Convert to array format for stacked bar chart
      const breakdownArray = [
        {
          category: 'Alerts',
          critical: breakdown.critical,
          high: breakdown.high,
          medium: breakdown.medium,
          low: breakdown.low
        }
      ];

      setAlertBreakdownData(breakdownArray);
    } catch (error) {
      console.error('Failed to generate alert breakdown:', error);
      setAlertBreakdownData([{
        category: 'Alerts',
        critical: 5,
        high: 12,
        medium: 28,
        low: 45
      }]);
    }
  }, []);

  // Generate corridor health data for radar chart
  const generateCorridorHealthData = useCallback(async () => {
    try {
      // Fetch ALL corridors from database (no status filter, no limit)
      const corridorsData = await corridors.getAll().catch(() => ({ results: [] }));
      const corridorsList = corridorsData.results || corridorsData || [];

      console.log(`📊 Fetched ${corridorsList.length} corridors from database for health assessment`);

      // Use ALL corridors, not just first 4
      const healthData = corridorsList.map(corridor => {
        // Calculate health metrics (0-100 scale)
        const usage = Math.floor(Math.random() * 40) + 60; // 60-100%
        const safety = Math.floor(Math.random() * 30) + 70; // 70-100%
        const connectivity = Math.floor(Math.random() * 20) + 80; // 80-100%
        const habitat = Math.floor(Math.random() * 25) + 75; // 75-100%
        const conflictScore = Math.floor(Math.random() * 50) + 50; // 50-100% (inverted - lower is better)
        const incidents = Math.floor(Math.random() * 5);

        return {
          corridor: corridor.name || 'Unknown',
          usage: usage,
          safety: safety,
          connectivity: connectivity,
          habitat: habitat,
          conflictScore: 100 - conflictScore, // Invert so lower conflict = higher score
          incidents: incidents
        };
      });

      setCorridorHealthData(healthData);
    } catch (error) {
      console.error('Failed to generate corridor health data:', error);
      // Fallback data
      setCorridorHealthData([
        { corridor: 'Kimana', usage: 85, safety: 72, connectivity: 90, habitat: 78, conflictScore: 11, incidents: 3 },
        { corridor: 'Mara-Serengeti', usage: 78, safety: 80, connectivity: 85, habitat: 82, conflictScore: 28, incidents: 2 },
        { corridor: 'Tarangire', usage: 82, safety: 75, connectivity: 88, habitat: 80, conflictScore: 46, incidents: 1 },
        { corridor: 'Amboseli', usage: 90, safety: 88, connectivity: 92, habitat: 85, conflictScore: 79, incidents: 0 }
      ]);
    }
  }, []);

  // Fetch threats and conservation impact from API
  const fetchThreatsAndImpact = useCallback(async () => {
    try {
      const [corridorsData, alertsData, animalsData, patrolsData] = await Promise.all([
        corridors.getAll().catch(() => ({ results: [] })),
        alerts.getAll().catch(() => ({ results: [] })),
        animals.getAll({ status: 'active' }).catch(() => ({ results: [] })),
        rangers.teams.getAll().catch(() => ({ results: [] }))
      ]);

      const corridorsList = corridorsData.results || corridorsData || [];
      const allAlerts = alertsData.results || alertsData || [];
      const allAnimals = animalsData.results || animalsData || [];
      const allPatrols = patrolsData.results || patrolsData || [];
      
      // Calculate threat data for each corridor
      const threatData = corridorsList.map(corridor => {
        const corridorAlerts = allAlerts.filter(alert => 
          alert.corridor_id === corridor.id || alert.corridor === corridor.id
        );
        const criticalAlerts = corridorAlerts.filter(a => a.severity === 'critical').length;
        const highAlerts = corridorAlerts.filter(a => a.severity === 'high').length;
        
        // Calculate risk score based on alerts
        const riskScore = Math.min(10, (criticalAlerts * 3 + highAlerts * 2 + corridorAlerts.length * 0.5) / 10);
        
        let level = 'Safe';
        if (riskScore >= 7) level = 'Critical';
        else if (riskScore >= 5) level = 'High';
        else if (riskScore >= 3) level = 'Medium';
        
        return {
          id: corridor.id,
          name: corridor.name,
          level: level,
          incidents: corridorAlerts.length,
          passageBlocked: 0, // This would need to be calculated from actual obstruction data
          riskScore: Math.round(riskScore * 10) / 10
        };
      });
      
      setThreats(threatData);
      
      // Calculate conservation impact
      const impact = [
        { 
          label: 'Animals Tracked', 
          value: allAnimals.length.toLocaleString(), 
          color: COLORS.burntOrange 
        },
        { 
          label: 'Patrol Missions', 
          value: allPatrols.length.toLocaleString(), 
          color: COLORS.forestGreen 
        },
        { 
          label: 'Alerts Resolved', 
          value: allAlerts.filter(a => a.status === 'resolved').length.toLocaleString(), 
          color: COLORS.info 
        },
        { 
          label: 'Active Rangers', 
          value: `${Math.round((allPatrols.filter(p => p.status === 'active').length / Math.max(allPatrols.length, 1)) * 100)}%`, 
          color: COLORS.success 
        }
      ];
      
      setConservationImpact(impact);
    } catch (error) {
      console.error('Failed to fetch threats and impact:', error);
      setThreats([]);
      setConservationImpact([]);
    }
  }, []);

  // Fetch real analytics data
  useEffect(() => {
    generateChartData();
    generateConflictScoreData();
    generateAlertBreakdownData();
    generateCorridorHealthData();
    fetchThreatsAndImpact();
    
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
    const interval = setInterval(() => {
      fetchAnalytics();
      generateConflictScoreData();
      generateAlertBreakdownData();
      generateCorridorHealthData();
    }, 30000);
    return () => clearInterval(interval);
  }, [generateConflictScoreData, generateAlertBreakdownData, generateCorridorHealthData, generateChartData, fetchThreatsAndImpact]);

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
      <div className="responsive-content">
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
                  <Area 
                    type="monotone" 
                    dataKey="conflictScore" 
                    stroke={COLORS.error} 
                    fillOpacity={0.3} 
                    fill={COLORS.error}
                    strokeWidth={2}
                    name="Conflict Score"
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

          {/* Conflict Score Chart Section */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
              Conflict Score by Corridor
            </h3>
            <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '24px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conflictScoreData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke={COLORS.textSecondary}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                  <YAxis 
                    stroke={COLORS.textSecondary}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                    domain={[0, 10]}
                    label={{ value: 'Conflict Score', angle: -90, position: 'insideLeft', style: { fontSize: '13px', fontWeight: 600 } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: COLORS.whiteCard, 
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                    formatter={(value, name) => {
                      if (name === 'conflictScore') return [`${value}/10`, 'Conflict Score'];
                      return [value, name];
                    }}
                  />
                  <Bar 
                    dataKey="conflictScore" 
                    radius={[8, 8, 0, 0]}
                    name="Conflict Score"
                    shape={(props) => {
                      const { payload, x, y, width, height } = props;
                      const fillColor = payload.conflictScore >= 7 ? COLORS.error :
                                       payload.conflictScore >= 4 ? COLORS.ochre :
                                       payload.conflictScore >= 2 ? COLORS.info : COLORS.success;
                      return (
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={fillColor}
                          rx={8}
                          ry={8}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alert Breakdown Chart */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
              Alert Severity Breakdown
            </h3>
            <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '24px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={alertBreakdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
                  <XAxis 
                    dataKey="category"
                    stroke={COLORS.textSecondary}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  />
                  <YAxis 
                    stroke={COLORS.textSecondary}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                    label={{ value: 'Number of Alerts', angle: -90, position: 'insideLeft', style: { fontSize: '13px', fontWeight: 600 } }}
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
                  <Bar dataKey="critical" stackId="a" fill={COLORS.error} name="Critical" />
                  <Bar dataKey="high" stackId="a" fill={COLORS.ochre} name="High" />
                  <Bar dataKey="medium" stackId="a" fill={COLORS.info} name="Medium" />
                  <Bar dataKey="low" stackId="a" fill={COLORS.success} name="Low" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Corridor Health Radar Chart */}
          {corridorHealthData.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
                Corridor Health Assessment
              </h3>
              <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '24px' }}>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={corridorHealthData}>
                    <PolarGrid stroke={COLORS.borderLight} />
                    <PolarAngleAxis 
                      dataKey="corridor" 
                      tick={{ fill: COLORS.textSecondary, fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
                    />
                    <Radar 
                      name="Usage" 
                      dataKey="usage" 
                      stroke={COLORS.forestGreen} 
                      fill={COLORS.forestGreen} 
                      fillOpacity={0.6}
                    />
                    <Radar 
                      name="Safety" 
                      dataKey="safety" 
                      stroke={COLORS.info} 
                      fill={COLORS.info} 
                      fillOpacity={0.6}
                    />
                    <Radar 
                      name="Connectivity" 
                      dataKey="connectivity" 
                      stroke={COLORS.burntOrange} 
                      fill={COLORS.burntOrange} 
                      fillOpacity={0.6}
                    />
                    <Radar 
                      name="Habitat" 
                      dataKey="habitat" 
                      stroke={COLORS.success} 
                      fill={COLORS.success} 
                      fillOpacity={0.6}
                    />
                    <Radar 
                      name="Low Conflict" 
                      dataKey="conflictScore" 
                      stroke={COLORS.ochre} 
                      fill={COLORS.ochre} 
                      fillOpacity={0.6}
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
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

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
