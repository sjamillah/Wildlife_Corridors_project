import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, MapPin, Users, Clock, Zap, Plus, Download } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { BRAND_COLORS, COLORS, rgba } from '../../constants/Colors';

const AlertHub = () => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const [alerts] = useState([
    {
      id: 'ALT-001',
      type: 'Critical',
      title: 'Human-Elephant Conflict',
      description: 'Nafisa herd approaching Kimana Village - KWS rangers dispatched',
      location: 'Kimana Village, Kajiado',
      timestamp: '2 min ago',
      status: 'active',
      priority: 'critical',
      animalId: 'KWS-E12',
      animalType: 'African Elephant',
      coordinates: [34.8532, -2.0891],
      responseTeam: 'KWS Amboseli Unit',
      estimatedRisk: 'High',
      story: 'Elephant herd led by matriarch Nafisa has been detected moving towards Kimana Village. KWS rangers have been dispatched to intercept and guide the herd away from populated areas. Coordination with local community leaders is underway.',
      riskLevel: 'Critical',
      team: {
        name: 'KWS Amboseli Unit',
        members: ['John Mwangi', 'Sarah Kipchoge', 'David Ochieng'],
        description: 'Specialized unit trained in human-wildlife conflict resolution'
      }
    },
    {
      id: 'ALT-002',
      type: 'Warning',
      title: 'Collar Battery Critical',
      description: 'Duma\'s GPS collar at 12% battery - field team scheduled for tomorrow',
      location: 'Aberdare National Park',
      timestamp: '15 min ago',
      status: 'acknowledged',
      priority: 'high',
      animalId: 'KWS-L04',
      animalType: 'Leopard',
      coordinates: [34.7821, -2.1245],
      responseTeam: 'Tech Team',
      estimatedRisk: 'Medium',
      story: 'GPS collar on leopard Duma has dropped to critical battery levels. Field team has been scheduled for battery replacement tomorrow morning. Animal remains in safe monitoring range.',
      riskLevel: 'High',
      team: {
        name: 'Tech Team',
        members: ['Peter Kimani', 'Mary Wanjiku'],
        description: 'Technical support team for tracking equipment maintenance'
      }
    },
    {
      id: 'ALT-003',
      type: 'Health',
      title: 'Unusual Movement Pattern',
      description: 'Animal showing abnormal movement - possible injury or illness',
      location: 'Highway Corridor',
      timestamp: '1 hour ago',
      status: 'investigating',
      priority: 'medium',
      animalId: 'R-008',
      animalType: 'Black Rhino',
      coordinates: [34.8901, -2.0672],
      responseTeam: 'Vet Team',
      estimatedRisk: 'Medium',
      story: 'Rhino R-008 has been showing unusual movement patterns consistent with potential injury or illness. Veterinary team dispatched to assess condition and provide treatment if necessary.',
      riskLevel: 'Medium',
      team: {
        name: 'Vet Team',
        members: ['Dr. James Omondi', 'Dr. Grace Akinyi'],
        description: 'Wildlife veterinary specialists for health assessments'
      }
    },
    {
      id: 'ALT-004',
      type: 'Maintenance',
      title: 'Scheduled Collar Check',
      description: 'Routine maintenance window for GPS collar diagnostics',
      location: 'Acacia Grove',
      timestamp: '3 hours ago',
      status: 'resolved',
      priority: 'low',
      animalId: 'G-017',
      animalType: 'Giraffe',
      coordinates: [34.8234, -2.1089],
      responseTeam: 'Maintenance',
      estimatedRisk: 'Low',
      story: 'Routine scheduled maintenance check completed successfully. All collar systems functioning normally.',
      riskLevel: 'Low',
      team: {
        name: 'Maintenance Team',
        members: ['Michael Otieno'],
        description: 'Routine maintenance and diagnostics team'
      }
    },
    {
      id: 'ALT-005',
      type: 'Security',
      title: 'Fence Breach Detected',
      description: 'Perimeter sensors indicate possible fence damage in protected area',
      location: 'North Ridge - Fence Line 4',
      timestamp: '5 hours ago',
      status: 'active',
      priority: 'high',
      animalId: 'Multiple',
      animalType: 'Various',
      coordinates: [34.7956, -2.0934],
      responseTeam: 'Security Team',
      estimatedRisk: 'High',
      story: 'Perimeter sensors detected possible fence breach at Fence Line 4 on North Ridge. Security patrol dispatched to investigate and repair if needed. Enhanced monitoring activated.',
      riskLevel: 'High',
      team: {
        name: 'Security Team',
        members: ['Robert Kiptoo', 'Susan Chebet', 'Paul Mwangi'],
        description: 'Security and perimeter monitoring unit'
      }
    }
  ]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/auth');
  };

  const handleNewAlert = () => {
    console.log('Creating new alert...');
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || alert.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Auto-select first alert if none selected
  React.useEffect(() => {
    if (!selectedAlert && filteredAlerts.length > 0) {
      setSelectedAlert(filteredAlerts[0]);
    }
  }, [filteredAlerts, selectedAlert]);

  const alertCounts = {
    all: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    investigating: alerts.filter(a => a.status === 'investigating').length,
    resolved: alerts.filter(a => a.status === 'resolved').length
  };

  const getSeverityColor = (priority) => {
    switch (priority) {
      case 'critical': return COLORS.error;
      case 'high': return COLORS.ochre;
      case 'medium': return COLORS.info;
      default: return COLORS.success;
    }
  };

  const getSeverityBg = (priority) => {
    switch (priority) {
      case 'critical': return COLORS.tintCritical;
      case 'high': return COLORS.tintWarning;
      case 'medium': return rgba('statusInfo', 0.1);
      default: return COLORS.tintSuccess;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.error;
      case 'acknowledged': return COLORS.info;
      case 'investigating': return COLORS.ochre;
      case 'resolved': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'active': return COLORS.tintCritical;
      case 'acknowledged': return rgba('statusInfo', 0.1);
      case 'investigating': return COLORS.tintWarning;
      case 'resolved': return COLORS.tintSuccess;
      default: return COLORS.creamBg;
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
              Alert Management
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Monitor and respond to conservation alerts
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Active count */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.error }}></div>
              Active: {alertCounts.active}
            </div>
            {/* New Alert button */}
            <button
              onClick={handleNewAlert}
              style={{
                background: COLORS.burntOrange,
                border: `2px solid ${COLORS.burntOrange}`,
                color: 'white',
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
              <Plus className="w-4 h-4" />
              New Alert
            </button>
          </div>
        </section>

        {/* Status Overview Bar */}
        <section style={{ background: COLORS.secondaryBg, padding: '20px 40px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <div style={{ display: 'flex', gap: '2px', background: COLORS.borderLight, borderRadius: '8px', overflow: 'hidden', height: '70px' }}>
            {/* Active */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.tintCritical,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => setFilterStatus('active')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.error, marginBottom: '4px' }}>
                {alertCounts.active}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Active
              </div>
            </div>

            {/* Acknowledged */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: rgba('statusInfo', 0.1),
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => setFilterStatus('acknowledged')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.info, marginBottom: '4px' }}>
                {alertCounts.acknowledged}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Acknowledged
              </div>
            </div>

            {/* Investigating */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.tintWarning,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => setFilterStatus('investigating')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.ochre, marginBottom: '4px' }}>
                {alertCounts.investigating}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Investigating
              </div>
            </div>

            {/* Resolved */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.tintSuccess,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => setFilterStatus('resolved')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.success, marginBottom: '4px' }}>
                {alertCounts.resolved}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Resolved
              </div>
            </div>

            {/* Total */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.secondaryBg,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            onClick={() => setFilterStatus('all')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, marginBottom: '4px' }}>
                {alertCounts.all}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Total
              </div>
            </div>
          </div>
        </section>

        {/* Alerts Section - Split Layout */}
        <section style={{ display: 'flex', height: 'calc(100vh - 240px)' }}>
          {/* Left Panel - Alert Cards (60%) */}
          <div style={{ width: '60%', overflowY: 'auto', background: COLORS.creamBg, padding: '32px 28px' }}>
            {/* Panel Header */}
            <div style={{ marginBottom: '24px' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSecondary }} />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 18px 14px 46px',
                    border: `2px solid ${COLORS.borderLight}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    background: 'white',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.forestGreen;
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46,93,69,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'active', 'acknowledged', 'investigating', 'resolved'].map((filter) => {
                  const isActive = filterStatus === filter;
                  const label = filter === 'all' ? 'All' :
                               filter === 'active' ? 'Active' :
                               filter === 'acknowledged' ? 'Acknowledged' :
                               filter === 'investigating' ? 'Investigating' : 'Resolved';

                  return (
                    <button
                      key={filter}
                      onClick={() => setFilterStatus(filter)}
                      style={{
                        padding: '8px 16px',
                        border: `1px solid ${isActive ? COLORS.forestGreen : COLORS.borderLight}`,
                        background: isActive ? COLORS.forestGreen : COLORS.whiteCard,
                        color: isActive ? COLORS.white : COLORS.textSecondary,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = COLORS.borderMedium;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.borderColor = COLORS.borderLight;
                        }
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alert Cards Grid */}
            <div style={{ display: 'grid', gap: '20px' }}>
              {filteredAlerts.map((alert) => {
                const severityColor = getSeverityColor(alert.priority);
                const severityBg = getSeverityBg(alert.priority);
                const statusColor = getStatusColor(alert.status);
                const statusBg = getStatusBg(alert.status);

                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    style={{
                      background: COLORS.whiteCard,
                      border: `1px solid ${selectedAlert?.id === alert.id ? COLORS.burntOrange : COLORS.borderLight}`,
                      borderRadius: '8px',
                      padding: '20px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAlert?.id !== alert.id) {
                        e.currentTarget.style.borderColor = COLORS.borderMedium;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAlert?.id !== alert.id) {
                        e.currentTarget.style.borderColor = COLORS.borderLight;
                      }
                    }}
                  >
                    {/* Left Accent Bar */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      borderRadius: '8px 0 0 8px',
                      background: severityColor
                    }}></div>

                    {/* Card Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      {/* Left Section */}
                      <div style={{ flex: 1 }}>
                        {/* Icon wrapper */}
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          background: severityBg,
                          marginBottom: '12px'
                        }}>
                          <AlertTriangle className="w-6 h-6" style={{ color: severityColor }} />
                        </div>
                        {/* Title */}
                        <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '8px' }}>
                          {alert.title}
                        </div>
                      </div>

                      {/* Right Section - Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                        {/* Status pill */}
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: statusBg,
                          color: statusColor
                        }}>
                          {alert.status}
                        </span>
                        {/* Severity pill */}
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: alert.priority === 'critical' ? COLORS.error :
                                     alert.priority === 'high' ? COLORS.ochre :
                                     alert.priority === 'medium' ? COLORS.info : COLORS.success,
                          color: 'white'
                        }}>
                          {alert.priority}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ fontSize: '14px', color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: '16px', textAlign: 'left' }}>
                      {alert.description}
                    </div>

                    {/* Meta Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', paddingTop: '14px', borderTop: `1px solid ${COLORS.creamBg}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: COLORS.textSecondary, fontWeight: 600 }}>
                        <MapPin className="w-3.5 h-3.5" />
                        {alert.location}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: COLORS.textSecondary, fontWeight: 600 }}>
                        <Clock className="w-3.5 h-3.5" />
                        {alert.timestamp}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: COLORS.textSecondary, fontWeight: 600 }}>
                        <Users className="w-3.5 h-3.5" />
                        {alert.responseTeam}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Details (40%) */}
          <div style={{ width: '40%', background: COLORS.whiteCard, overflowY: 'auto', padding: '40px 36px', borderLeft: `2px solid ${COLORS.borderLight}` }}>
            {selectedAlert ? (
              <>
                {/* Details Header */}
                <div style={{ marginBottom: '28px' }}>
                  {/* Icon */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '10px',
                    background: getSeverityBg(selectedAlert.priority),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    marginBottom: '16px'
                  }}>
                    <AlertTriangle className="w-7 h-7" style={{ color: getSeverityColor(selectedAlert.priority) }} />
                  </div>
                  {/* Title */}
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: COLORS.textPrimary, marginBottom: '6px', lineHeight: 1.3 }}>
                    {selectedAlert.title}
                  </h2>
                  {/* ID */}
                  <div style={{ fontSize: '12px', color: COLORS.textSecondary, fontWeight: 500, marginBottom: '16px' }}>
                    {selectedAlert.id}
                  </div>
                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: getStatusBg(selectedAlert.status),
                      color: getStatusColor(selectedAlert.status)
                    }}>
                      {selectedAlert.status}
                    </span>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: selectedAlert.priority === 'critical' ? COLORS.error :
                                 selectedAlert.priority === 'high' ? COLORS.ochre :
                                 selectedAlert.priority === 'medium' ? COLORS.info : COLORS.success,
                      color: 'white'
                    }}>
                      {selectedAlert.priority}
                    </span>
                  </div>
                </div>

                {/* Story Section */}
                <div style={{ background: COLORS.secondaryBg, padding: '20px', marginBottom: '32px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                    Story
                  </div>
                  <div style={{ fontSize: '15px', color: COLORS.textPrimary, lineHeight: 1.8, textAlign: 'left' }}>
                    {selectedAlert.story}
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ paddingBottom: '12px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      Location
                    </div>
                    <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin className="w-4.5 h-4.5" style={{ color: COLORS.textSecondary }} />
                      {selectedAlert.location}
                    </div>
                  </div>

                  <div style={{ paddingBottom: '12px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      Animal
                    </div>
                    <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: 500 }}>
                      {selectedAlert.animalType} - {selectedAlert.animalId}
                    </div>
                  </div>

                  <div style={{ paddingBottom: '12px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      Timestamp
                    </div>
                    <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Clock className="w-4.5 h-4.5" style={{ color: COLORS.textSecondary }} />
                      {selectedAlert.timestamp}
                    </div>
                  </div>
                </div>

                {/* Risk Card */}
                <div style={{ paddingBottom: '16px', borderBottom: `1px solid ${COLORS.borderLight}`, marginBottom: '32px' }}>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Risk Level
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: COLORS.error, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle className="w-5 h-5" />
                    {selectedAlert.riskLevel}
                  </div>
                </div>

                {/* Team Section */}
                <div style={{ paddingBottom: '16px', borderBottom: `1px solid ${COLORS.borderLight}`, marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Users className="w-4.5 h-4.5" style={{ color: COLORS.textSecondary }} />
                    <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPrimary }}>
                      {selectedAlert.team.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: BRAND_COLORS.TEXT_TERTIARY, lineHeight: 1.6, textAlign: 'left' }}>
                    {selectedAlert.team.description}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${COLORS.borderLight}` }}>
                  {/* Primary Button */}
                  <button
                    onClick={() => console.log('Respond to', selectedAlert.id)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: COLORS.burntOrange,
                      border: 'none',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
                  >
                    <Zap className="w-4 h-4" />
                    Respond
                  </button>
                  {/* Secondary Buttons */}
                  <button
                    onClick={() => console.log('Acknowledge', selectedAlert.id)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'transparent',
                      border: `1px solid ${COLORS.borderLight}`,
                      color: COLORS.textSecondary,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderMedium;
                      e.currentTarget.style.background = COLORS.secondaryBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderLight;
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => console.log('Export', selectedAlert.id)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'transparent',
                      border: `1px solid ${COLORS.borderLight}`,
                      color: COLORS.textSecondary,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderMedium;
                      e.currentTarget.style.background = COLORS.secondaryBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = COLORS.borderLight;
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export Details
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.textSecondary, fontSize: '14px' }}>
                Select an alert to view details
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AlertHub;
