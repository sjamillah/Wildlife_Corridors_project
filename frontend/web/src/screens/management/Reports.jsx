import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Users, 
  Activity, 
  AlertTriangle, 
  Eye, 
  MapPin 
} from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import { COLORS } from '../../constants/Colors';
import { auth } from '../../services';

const MOCK_REPORTS = {
  wildlife: [
    {
      id: 'WR-001',
      title: 'Monthly Wildlife Movement Analysis',
      description: 'Comprehensive analysis of animal movement patterns',
      date: '2024-10-01',
      author: 'Dr. Jane Mwangi',
      status: 'completed',
      type: 'monthly',
      fileSize: '2.4',
      downloads: 156,
      location: { area: 'Nairobi National Park' },
      riskLevel: 'medium'
    }
  ],
  patrol: [],
  incident: [],
  monitoring: []
};

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('wildlife');
  const [dateRange, setDateRange] = useState('30d');
  const [generating, setGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportsData] = useState(MOCK_REPORTS);
  const navigate = useNavigate();

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

  useEffect(() => {
    console.log('Reports screen initialized');
    setLoading(false);
  }, []);

  const reportCategories = [
    { id: 'wildlife', label: 'Wildlife Reports', count: (reportsData.wildlife || []).length },
    { id: 'patrol', label: 'Patrol Reports', count: (reportsData.patrol || []).length },
    { id: 'incident', label: 'Incident Reports', count: (reportsData.incident || []).length },
    { id: 'monitoring', label: 'Monitoring Reports', count: (reportsData.monitoring || []).length }
  ];

  const currentReportsList = reportsData[selectedReport] || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: COLORS.tintSuccess, border: COLORS.success, text: COLORS.success };
      case 'draft': return { bg: COLORS.tintWarning, border: COLORS.ochre, text: COLORS.ochre };
      default: return { bg: COLORS.creamBg, border: COLORS.textSecondary, text: COLORS.textSecondary };
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

  const getIconForCategory = (categoryId) => {
    switch(categoryId) {
      case 'wildlife': return <Activity size={20} />;
      case 'patrol': return <Users size={20} />;
      case 'incident': return <AlertTriangle size={20} />;
      case 'monitoring': return <Eye size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: COLORS.creamBg, minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} />
      
      <div style={{ marginLeft: '260px', minHeight: '100vh' }}>
        <section style={{ background: COLORS.forestGreen, padding: '28px 40px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '6px' }}>
              Reports & Analytics
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Research documentation and field reports
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                cursor: 'pointer'
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            <button 
              onClick={() => {
                setGenerating(true);
                setTimeout(() => {
                  setGenerating(false);
                  setSuccessMessage(`Report generated successfully!`);
                  setTimeout(() => setSuccessMessage(''), 3000);
                }, 1500);
              }}
              disabled={generating}
              style={{
                background: generating ? COLORS.textSecondary : COLORS.burntOrange,
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: generating ? 'not-allowed' : 'pointer'
              }}
            >
              <FileText size={16} />
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </section>

        <section style={{ padding: '32px 40px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <Activity size={48} color={COLORS.forestGreen} />
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
                {reportCategories.map((category) => {
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
                        textAlign: 'left'
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
                          justifyContent: 'center',
                          color: isSelected ? 'white' : COLORS.textPrimary
                        }}>
                          {getIconForCategory(category.id)}
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

              <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '28px', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
                  {reportCategories.find(cat => cat.id === selectedReport)?.label}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {currentReportsList.map((report) => {
                    const statusColors = getStatusColor(report.status);
                    const riskColors = getRiskColor(report.riskLevel);
                    return (
                      <div key={report.id} style={{
                        border: '1px solid',
                        borderColor: COLORS.borderLight,
                        borderRadius: '8px',
                        padding: '24px',
                        background: 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary }}>
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
                            </div>
                            <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '12px' }}>
                              {report.description}
                            </p>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: COLORS.textSecondary, marginBottom: '12px' }}>
                              <span>By {report.author}</span>
                              <span>{report.date}</span>
                              <span>{report.fileSize}MB</span>
                              <span>{report.downloads} downloads</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: COLORS.textSecondary }}>
                                <MapPin size={16} />
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
                          <div style={{ display: 'flex', gap: '12px', marginLeft: '16px' }}>
                            <button style={{
                              padding: '10px 16px',
                              background: COLORS.burntOrange,
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer'
                            }}>
                              <Download size={16} />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {currentReportsList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textSecondary }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <FileText size={48} color={COLORS.textSecondary} />
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 600 }}>No reports available</div>
                      <div style={{ fontSize: '14px', marginTop: '8px' }}>Generate a new report to get started</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: COLORS.success,
          color: 'white',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: 600
        }}>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default Reports;
