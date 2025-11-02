import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, Filter, Search, TrendingUp, Users, Activity, AlertTriangle, Eye, Clock, BarChart, MapPin } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { COLORS, rgba } from '../../constants/Colors';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('wildlife');
  const [dateRange, setDateRange] = useState('30d');
  const [generating, setGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  // Chart data for trends
  const trendData = [
    { month: 'Jan', wildlife: 12, patrol: 8, incident: 3, monitoring: 15 },
    { month: 'Feb', wildlife: 15, patrol: 10, incident: 4, monitoring: 18 },
    { month: 'Mar', wildlife: 18, patrol: 12, incident: 5, monitoring: 20 },
    { month: 'Apr', wildlife: 22, patrol: 15, incident: 6, monitoring: 24 },
    { month: 'May', wildlife: 28, patrol: 18, incident: 8, monitoring: 28 },
    { month: 'Jun', wildlife: 32, patrol: 20, incident: 7, monitoring: 32 },
    { month: 'Jul', wildlife: 38, patrol: 22, incident: 9, monitoring: 38 },
    { month: 'Aug', wildlife: 40, patrol: 24, incident: 10, monitoring: 42 },
    { month: 'Sep', wildlife: 42, patrol: 26, incident: 11, monitoring: 50 },
    { month: 'Oct', wildlife: 45, patrol: 28, incident: 12, monitoring: 67 }
  ];

  // Download statistics
  const downloadStats = [
    { category: 'Wildlife', downloads: 450 },
    { category: 'Patrol', downloads: 320 },
    { category: 'Incident', downloads: 180 },
    { category: 'Monitoring', downloads: 580 }
  ];

  // Status distribution
  const statusData = [
    { name: 'Completed', value: 85, color: COLORS.success },
    { name: 'In Progress', value: 32, color: COLORS.ochre },
    { name: 'Draft', value: 15, color: COLORS.textSecondary }
  ];

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
      case 'completed': return { bg: COLORS.tintSuccess, border: COLORS.success, text: COLORS.success };
      case 'draft': return { bg: COLORS.tintWarning, border: COLORS.ochre, text: COLORS.ochre };
      case 'pending': return { bg: rgba('statusInfo', 0.1), border: COLORS.info, text: COLORS.info };
      default: return { bg: COLORS.creamBg, border: COLORS.textSecondary, text: COLORS.textSecondary };
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

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return { bg: COLORS.tintSuccess, text: COLORS.success };
      case 'medium': return { bg: COLORS.tintWarning, text: COLORS.ochre };
      case 'high': return { bg: COLORS.tintCritical, text: COLORS.error };
      default: return { bg: COLORS.creamBg, text: COLORS.textSecondary };
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
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '6px', letterSpacing: '-0.6px' }}>
              Reports & Analytics
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Research documentation and field reports
            </p>
              </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Date range selector */}
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
            >
              <option value="7d" style={{ background: COLORS.forestGreen, color: 'white' }}>Last 7 days</option>
              <option value="30d" style={{ background: COLORS.forestGreen, color: 'white' }}>Last 30 days</option>
              <option value="90d" style={{ background: COLORS.forestGreen, color: 'white' }}>Last 3 months</option>
              <option value="1y" style={{ background: COLORS.forestGreen, color: 'white' }}>Last year</option>
              </select>
            {/* Generate Report button */}
            <button 
              onClick={() => {
                setGenerating(true);
                setTimeout(() => {
                  setGenerating(false);
                  setSuccessMessage(`${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} report generated for ${dateRange}!`);
                  setTimeout(() => setSuccessMessage(''), 3000);
                  // TODO: API call to generate report
                  // const response = await fetch('/api/reports/generate', { 
                  //   method: 'POST', 
                  //   body: JSON.stringify({ type: selectedReport, range: dateRange }) 
                  // });
                }, 1500);
              }}
              disabled={generating}
              style={{
                background: generating ? COLORS.textSecondary : COLORS.burntOrange,
                border: `2px solid ${generating ? COLORS.textSecondary : COLORS.burntOrange}`,
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: generating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: generating ? 0.7 : 1
              }}
              onMouseEnter={(e) => { 
                if (!generating) {
                  e.currentTarget.style.background = COLORS.terracotta; 
                  e.currentTarget.style.borderColor = COLORS.terracotta; 
                }
              }}
              onMouseLeave={(e) => { 
                if (!generating) {
                  e.currentTarget.style.background = COLORS.burntOrange; 
                  e.currentTarget.style.borderColor = COLORS.burntOrange; 
                }
              }}
            >
              <FileText className="w-4 h-4" />
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
            </div>
        </section>

        {/* Content */}
        <section style={{ padding: '32px 40px' }}>
            {/* Report Categories */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
            {reportCategories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedReport === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedReport(category.id)}
                  style={{
                    background: COLORS.whiteCard,
                    border: `2px solid ${isSelected ? COLORS.forestGreen : COLORS.borderLight}`,
                    borderRadius: '10px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = COLORS.borderMedium;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = COLORS.borderLight;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: isSelected ? COLORS.forestGreen : COLORS.creamBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent className="w-5 h-5" style={{ color: isSelected ? 'white' : COLORS.textPrimary }} />
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: isSelected ? COLORS.forestGreen : COLORS.textPrimary }}>
                      {category.count}
                    </div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: COLORS.textPrimary }}>
                    {category.label}
                  </div>
                </button>
              );
            })}
            </div>

            {/* Report Analytics Dashboard */}
          <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '28px', marginBottom: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart className="w-5 h-5" style={{ color: COLORS.forestGreen }} />
                Report Analytics
                  </h3>
              <p style={{ fontSize: '13px', color: COLORS.textSecondary }}>
                Statistical overview of {reportCategories.find(cat => cat.id === selectedReport)?.label.toLowerCase()}
              </p>
              </div>
              
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {/* Total Reports */}
              <div style={{ background: COLORS.secondaryBg, border: `1px solid ${COLORS.borderLight}`, borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <FileText className="w-6 h-6" style={{ color: COLORS.forestGreen }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: COLORS.textSecondary, background: COLORS.creamBg, padding: '4px 8px', borderRadius: '4px' }}>
                    Total
                  </span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: COLORS.forestGreen, marginBottom: '4px' }}>
                  {reports[selectedReport].length}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary }}>
                  Active Reports
                  </div>
                </div>

                {/* Completed Reports */}
              <div style={{ background: COLORS.tintSuccess, border: `1px solid ${COLORS.success}`, borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: COLORS.success }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: COLORS.success, background: COLORS.tintSuccess, padding: '4px 8px', borderRadius: '4px' }}>
                    Status
                  </span>
                  </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: COLORS.success, marginBottom: '4px' }}>
                    {reports[selectedReport].filter(r => r.status === 'completed').length}
                  </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary }}>
                  Completed
                </div>
                </div>

                {/* Average Size */}
              <div style={{ background: COLORS.tintWarning, border: `1px solid ${COLORS.ochre}`, borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Download className="w-6 h-6" style={{ color: COLORS.ochre }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: COLORS.ochre, background: COLORS.tintWarning, padding: '4px 8px', borderRadius: '4px' }}>
                    Size
                  </span>
                  </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: COLORS.ochre, marginBottom: '4px' }}>
                    {(reports[selectedReport].reduce((acc, r) => acc + parseFloat(r.fileSize), 0) / reports[selectedReport].length).toFixed(1)}MB
                  </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary }}>
                  Avg Size
                </div>
                </div>

                {/* Total Downloads */}
              <div style={{ background: rgba('statusInfo', 0.1), border: `1px solid ${COLORS.info}`, borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Users className="w-6 h-6" style={{ color: COLORS.info }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: COLORS.info, background: rgba('statusInfo', 0.1), padding: '4px 8px', borderRadius: '4px' }}>
                    Usage
                  </span>
                  </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: COLORS.info, marginBottom: '4px' }}>
                    {reports[selectedReport].reduce((acc, r) => acc + r.downloads, 0)}
                  </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: COLORS.textSecondary }}>
                  Total Downloads
                </div>
                </div>
              </div>

            {/* Charts Section */}
            <div style={{ paddingTop: '24px', borderTop: `1px solid ${COLORS.creamBg}`, marginBottom: '28px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
                Report Generation Trends
              </h4>
              
              {/* Line Chart */}
              <div style={{ marginBottom: '32px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
                    <XAxis 
                      dataKey="month" 
                      stroke={COLORS.textSecondary}
                      style={{ fontSize: '12px', fontFamily: 'Inter' }}
                    />
                    <YAxis 
                      stroke={COLORS.textSecondary}
                      style={{ fontSize: '12px', fontFamily: 'Inter' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: COLORS.whiteCard,
                        border: `1px solid ${COLORS.borderLight}`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontFamily: 'Inter'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '13px', fontFamily: 'Inter', paddingTop: '16px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="wildlife" 
                      stroke={COLORS.forestGreen} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.forestGreen, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Wildlife Reports"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="patrol" 
                      stroke={COLORS.burntOrange} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.burntOrange, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Patrol Reports"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="incident" 
                      stroke={COLORS.error} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.error, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Incident Reports"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="monitoring" 
                      stroke={COLORS.info} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.info, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Monitoring Reports"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart and Pie Chart Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Bar Chart - Downloads */}
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '16px' }}>
                    Total Downloads by Category
                  </h5>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsBarChart data={downloadStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
                      <XAxis 
                        dataKey="category" 
                        stroke={COLORS.textSecondary}
                        style={{ fontSize: '12px', fontFamily: 'Inter' }}
                      />
                      <YAxis 
                        stroke={COLORS.textSecondary}
                        style={{ fontSize: '12px', fontFamily: 'Inter' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: COLORS.whiteCard,
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontFamily: 'Inter'
                        }}
                      />
                      <Bar 
                        dataKey="downloads" 
                        fill={COLORS.forestGreen}
                        radius={[6, 6, 0, 0]}
                        name="Downloads"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart - Status Distribution */}
                <div>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '16px' }}>
                    Report Status
                  </h5>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          background: COLORS.whiteCard,
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontFamily: 'Inter'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                </div>
              </div>

            {/* Recent Activity Timeline */}
            <div style={{ paddingTop: '24px', borderTop: `1px solid ${COLORS.creamBg}` }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '16px' }}>
                Recent Activity Timeline
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reports[selectedReport].slice(0, 3).map((report) => {
                  const statusColors = getStatusColor(report.status);
                  return (
                    <div key={report.id} style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '16px',
                      background: COLORS.secondaryBg,
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: statusColors.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: statusColors.text
                      }}>
                        {getTypeIcon(report.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.textPrimary }}>
                            {report.title}
                          </div>
                          <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                            {report.date}
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '8px' }}>
                          {report.description}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: COLORS.textSecondary }}>
                          <span>By {report.author}</span>
                          <span>{report.fileSize}</span>
                          <span>{report.downloads} downloads</span>
                          <span style={{ color: COLORS.forestGreen, fontWeight: 600 }}>{report.location.area}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </div>

          {/* Reports List Section */}
          <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary }}>
                  {reportCategories.find(cat => cat.id === selectedReport)?.label}
                </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: COLORS.textSecondary, width: '16px', height: '16px' }} />
                    <input
                      type="text"
                      placeholder="Search reports..."
                    style={{
                      paddingLeft: '36px',
                      paddingRight: '16px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      width: '240px'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
                    />
                  </div>
                {/* Filter button */}
                <button style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid #E8E3D6',
                  borderRadius: '6px',
                  color: COLORS.textSecondary,
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.borderMedium;
                  e.currentTarget.style.background = COLORS.secondaryBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E8E3D6';
                  e.currentTarget.style.background = 'transparent';
                }}
                >
                    <Filter className="w-4 h-4" />
                  Filter
                  </button>
                </div>
              </div>

              {/* Reports List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reports[selectedReport].map((report) => {
                const statusColors = getStatusColor(report.status);
                const riskColors = getRiskColor(report.riskLevel);
                return (
                  <div key={report.id} style={{
                    border: '1px solid #E8E3D6',
                    borderRadius: '8px',
                    padding: '24px',
                    transition: 'all 0.2s ease',
                    background: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#D4CCBA';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E8E3D6';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#2C2416' }}>
                            {report.title}
                          </h4>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: statusColors.bg,
                            border: `1px solid ${statusColors.border}`,
                            color: statusColors.text,
                            textTransform: 'uppercase'
                          }}>
                            {report.status}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B5E4F', fontSize: '12px' }}>
                            {getTypeIcon(report.type)}
                            <span>{report.type}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '14px', color: '#6B5E4F', marginBottom: '12px' }}>
                          {report.description}
                        </p>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#6B5E4F', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <span>By {report.author}</span>
                          <span>{report.date}</span>
                          <span>{report.fileSize}</span>
                          <span>{report.downloads} downloads</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B5E4F' }}>
                            <MapPin className="w-4 h-4" style={{ color: '#6B5E4F' }} />
                            <span>{report.location.area}</span>
                          </div>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: riskColors.bg,
                            color: riskColors.text
                          }}>
                            {report.riskLevel} risk
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: '16px' }}>
                        <button style={{
                          padding: '8px',
                          background: 'transparent',
                          border: `1px solid ${COLORS.borderLight}`,
                          borderRadius: '6px',
                          color: COLORS.textSecondary,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#2E5D45';
                          e.currentTarget.style.color = '#2E5D45';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = COLORS.borderLight;
                          e.currentTarget.style.color = '#6B5E4F';
                        }}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button style={{
                          padding: '10px 16px',
                          background: '#D84315',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#BF3812'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#D84315'; }}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
        </section>
      </div>

      {/* Success Message Toast */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: COLORS.success,
          color: COLORS.white,
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: 600,
          animation: 'slideIn 0.3s ease'
        }}>
          {successMessage}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
