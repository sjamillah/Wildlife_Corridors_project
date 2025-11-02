import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, Plus, ChevronRight } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import MapComponent from '../../components/shared/MapComponent';
import { isAllowedSpecies } from '../../constants/Animals';
import { COLORS, rgba } from '../../constants/Colors';
import { Play, Pause, SkipBack, SkipForward, Layers, Brain, AlertTriangle, TrendingUp } from '@/components/shared/Icons';

const WildlifeTracking = () => {
  const navigate = useNavigate();
  
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapZoom, setMapZoom] = useState(7);
  
  // ML Feature Toggles
  const [showPredictions, setShowPredictions] = useState(true);
  const [showBehavior, setShowBehavior] = useState(true);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState(false);
  const [showEnvLayers, setShowEnvLayers] = useState(false);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [mlPanelOpen, setMlPanelOpen] = useState(true);
  
  const [animals, setAnimals] = useState([
    { 
      id: 'KWS-E12', 
      species: 'African Elephant', 
      name: 'Nafisa (Matriarch)', 
      status: 'Moving', 
      location: 'Kimana Corridor', 
      coordinates: [-2.0891, 34.8532],
      battery: 85, 
      lastSeen: '10 min ago', 
      risk: 'High',
      age: '18 years',
      gender: 'Female',
      health: 'Good',
      speed: 2.3,
      collarDate: '2023-08-15',
      icon: '🐘',
      movementHistory: [
        [-2.0991, 34.8432],
        [-2.0941, 34.8482],
        [-2.0891, 34.8532]
      ]
    },
    { 
      id: 'KWS-E08', 
      species: 'African Elephant', 
      name: 'Bomani (Bull)', 
      status: 'Feeding', 
      location: 'Mara River', 
      coordinates: [-2.1145, 34.8721],
      battery: 92, 
      lastSeen: '5 min ago', 
      risk: 'Medium',
      age: '25 years',
      gender: 'Male',
      health: 'Excellent',
      speed: 1.2,
      collarDate: '2023-09-20',
      icon: '🐘',
      movementHistory: [
        [-2.1245, 34.8621],
        [-2.1195, 34.8671],
        [-2.1145, 34.8721]
      ]
    },
    { 
      id: 'KWS-E15', 
      species: 'African Elephant', 
      name: 'Temba (Young Bull)', 
      status: 'Moving', 
      location: 'Acacia Plains', 
      coordinates: [-2.0789, 34.8234],
      battery: 78, 
      lastSeen: '18 min ago', 
      risk: 'Low',
      age: '12 years',
      gender: 'Male',
      health: 'Good',
      speed: 3.1,
      collarDate: '2024-01-15',
      icon: '🐘',
      movementHistory: [
        [-2.0889, 34.8134],
        [-2.0839, 34.8184],
        [-2.0789, 34.8234]
      ]
    },
    {
      id: 'WB-001',
      species: 'Wildebeest',
      name: 'Herd Alpha',
      status: 'Moving',
      location: 'Migration Route North',
      coordinates: [-2.1, 34.81],
      battery: 76,
      lastSeen: '5 min ago',
      risk: 'Medium',
      age: 'Herd (150 individuals)',
      gender: 'Mixed',
      health: 'Good',
      speed: 6.2,
      collarDate: '2024-02-10',
      icon: '🦬',
      movementHistory: [
        [-2.105, 34.805],
        [-2.1025, 34.8075],
        [-2.1, 34.81]
      ]
    },
    {
      id: 'WB-003',
      species: 'Wildebeest',
      name: 'Herd Beta',
      status: 'Grazing',
      location: 'Musiara Marsh',
      coordinates: [-2.0656, 34.8445],
      battery: 88,
      lastSeen: '12 min ago',
      risk: 'Low',
      age: 'Herd (230 individuals)',
      gender: 'Mixed',
      health: 'Excellent',
      speed: 0.8,
      collarDate: '2024-03-05',
      icon: '🦬',
      movementHistory: [
        [-2.0756, 34.8345],
        [-2.0706, 34.8395],
        [-2.0656, 34.8445]
      ]
    },
    {
      id: 'WB-007',
      species: 'Wildebeest',
      name: 'Herd Gamma',
      status: 'Moving',
      location: 'Crossing Point Delta',
      coordinates: [-2.0934, 34.7956],
      battery: 65,
      lastSeen: '25 min ago',
      risk: 'High',
      age: 'Herd (85 individuals)',
      gender: 'Mixed',
      health: 'Monitoring',
      speed: 8.5,
      collarDate: '2023-12-18',
      icon: '🦬',
      movementHistory: [
        [-2.1034, 34.7856],
        [-2.0984, 34.7906],
        [-2.0934, 34.7956]
      ]
    }
  ]);

  // Simulate real-time movement
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimals(prev => prev.map(animal => {
        if (animal.status === 'Moving') {
          const newLat = animal.coordinates[0] + (Math.random() - 0.5) * 0.003;
          const newLng = animal.coordinates[1] + (Math.random() - 0.5) * 0.003;
          return {
            ...animal,
            coordinates: [newLat, newLng],
            movementHistory: [...animal.movementHistory.slice(-2), [newLat, newLng]]
          };
        }
        return animal;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    navigate('/auth');
  };

  // Calculate stats
  const totalTracked = animals.length;
  const activeNow = animals.filter(a => a.status === 'Moving' || a.status === 'Feeding').length;
  const highRisk = animals.filter(a => a.risk === 'High').length;
  const lowBattery = animals.filter(a => a.battery < 30).length;
  const healthAlerts = animals.filter(a => a.health === 'Monitoring' || a.health === 'Poor').length;

  // Filter animals
  const visibleAnimals = animals.filter(a => isAllowedSpecies(a.species));

  const filteredAnimals = filterSpecies === 'all' 
    ? visibleAnimals 
    : animals.filter(a => a.species.toLowerCase().includes(filterSpecies.toLowerCase()));

  // Filter by search query
  const searchFilteredAnimals = searchQuery === ''
    ? filteredAnimals
    : filteredAnimals.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Mock ML Model Data - Replace with real API calls
  const mockPredictedPaths = [
    {
      animalId: animals[0]?.id,
      path: [
        animals[0]?.coordinates,
        [animals[0]?.coordinates[0] - 0.05, animals[0]?.coordinates[1] + 0.03],
        [animals[0]?.coordinates[0] - 0.10, animals[0]?.coordinates[1] + 0.05]
      ],
      confidence: 0.85,
      model: 'BBMM'
    },
    {
      animalId: animals[1]?.id,
      path: [
        animals[1]?.coordinates,
        [animals[1]?.coordinates[0] + 0.03, animals[1]?.coordinates[1] - 0.02],
        [animals[1]?.coordinates[0] + 0.06, animals[1]?.coordinates[1] - 0.04]
      ],
      confidence: 0.72,
      model: 'LSTM'
    }
  ];

  const mockBehavioralStates = {
    [animals[0]?.id]: { state: 'Migrating', confidence: 0.92 },
    [animals[1]?.id]: { state: 'Foraging', confidence: 0.88 },
    [animals[2]?.id]: { state: 'Resting', confidence: 0.76 }
  };

  const mockRiskHeatmap = [
    { position: [-2.0, 35.5], intensity: 0.85, type: 'poaching' },
    { position: [-1.5, 35.3], intensity: 0.62, type: 'conflict' },
    { position: [-2.2, 35.7], intensity: 0.48, type: 'poaching' }
  ];

  // Create markers for map - use actual animal species and risk-based colors
  const mapMarkers = searchFilteredAnimals.map(animal => {
    // Determine icon type based on species
    let iconType = 'wildlife';
    if (animal.species.toLowerCase().includes('elephant')) {
      iconType = 'elephant';
    } else if (animal.species.toLowerCase().includes('wildebeest')) {
      iconType = 'wildebeest';
    }
    
    // Color based on risk level
    let markerColor = COLORS.forestGreen; // Normal/Safe - Green
    if (animal.risk === 'High') {
      markerColor = COLORS.error; // High risk - Red
    } else if (animal.risk === 'Medium') {
      markerColor = COLORS.ochre; // Medium risk - Orange
    }
    
    return {
      id: animal.id,
      position: animal.coordinates,
      type: iconType,
      title: animal.name,
      description: `${animal.species} | ${animal.status} | ${animal.location}`,
      color: markerColor,
      timestamp: animal.lastSeen,
      emoji: animal.icon // Pass the emoji from animal data
    };
  });

  const getBatteryColor = (battery) => {
    if (battery > 70) return COLORS.success;
    if (battery > 30) return COLORS.ochre;
    return COLORS.error;
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh', display: 'flex' }}>
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div style={{ marginLeft: '260px', minHeight: '100vh', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Page Header */}
        <section style={{ background: COLORS.forestGreen, padding: '28px 40px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: COLORS.white, marginBottom: '6px', letterSpacing: '-0.6px' }}>
              Wildlife Tracking
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Real-time animal monitoring & conservation
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Active count with pulse dot */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: COLORS.white, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.success, animation: 'pulse 2s ease-in-out infinite' }}></div>
              Active: {activeNow}
            </div>
            {/* Toggle Panel button */}
            <button
              onClick={() => setPanelCollapsed(!panelCollapsed)}
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
              {panelCollapsed ? 'Show Panel' : 'Hide Panel'}
            </button>
          </div>
        </section>

        {/* Status Overview Bar */}
        <section style={{ background: COLORS.secondaryBg, padding: '20px 40px', borderBottom: `1px solid ${COLORS.borderLight}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '2px', background: COLORS.borderLight, borderRadius: '8px', overflow: 'hidden', height: '70px' }}>
            {/* Total Tracked */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.tintRangers,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.forestGreen, marginBottom: '4px' }}>
                {totalTracked}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Total Tracked
              </div>
            </div>

            {/* Active Now */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: rgba('burntOrange', 0.1),
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.burntOrange, marginBottom: '4px' }}>
                {activeNow}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Active Now
              </div>
            </div>

            {/* High Risk */}
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
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.error, marginBottom: '4px' }}>
                {highRisk}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                High Risk
              </div>
            </div>

            {/* Low Battery */}
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
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.ochre, marginBottom: '4px' }}>
                {lowBattery}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Low Battery
              </div>
            </div>

            {/* Health Alerts */}
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
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.info, marginBottom: '4px' }}>
                {healthAlerts}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Health Alerts
              </div>
            </div>
          </div>
        </section>

        {/* Map Section Layout */}
        <section style={{ display: 'flex', position: 'relative', height: '700px', marginBottom: '40px' }}>
          {/* Map Container */}
          <div style={{ flex: 1, position: 'relative', minWidth: 0, height: '100%', overflow: 'hidden' }}>
            <MapComponent
              markers={mapMarkers}
              height="100%"
              hideControls={true}
              hideLegend={true}
              hideMapInfo={true}
              showLegendBox={true}
              zoom={mapZoom}
              predictedPaths={showPredictions ? mockPredictedPaths : []}
              behavioralStates={showBehavior ? mockBehavioralStates : {}}
              riskHeatmap={showRiskHeatmap ? mockRiskHeatmap : []}
              showPredictedPaths={showPredictions}
            />

            {/* Map Controls Overlay */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '12px', zIndex: 1000, pointerEvents: 'auto' }}>
              {/* Filter Pills */}
              {['all', 'elephant', 'wildebeest'].map((filter) => {
                const label = filter === 'all' ? 'All' : filter === 'elephant' ? 'Elephants' : 'Wildebeest';
                const isActive = filterSpecies === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setFilterSpecies(filter)}
                    style={{
                      padding: '8px 16px',
                      background: isActive ? COLORS.forestGreen : COLORS.whiteCard,
                      border: `1px solid ${isActive ? COLORS.forestGreen : COLORS.borderLight}`,
                      color: isActive ? COLORS.white : COLORS.textSecondary,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'auto'
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

            {/* Zoom Controls */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 1000, pointerEvents: 'auto' }}>
              <button
                onClick={() => setMapZoom(prev => Math.min(prev + 1, 18))}
                style={{
                  width: '36px',
                  height: '36px',
                  background: COLORS.whiteCard,
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'auto'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.creamBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.whiteCard; }}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMapZoom(prev => Math.max(prev - 1, 3))}
                style={{
                  width: '36px',
                  height: '36px',
                  background: COLORS.whiteCard,
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  pointerEvents: 'auto'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.creamBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.whiteCard; }}
              >
                <span style={{ fontSize: '20px', fontWeight: 600 }}>−</span>
              </button>
            </div>

            {/* Advanced ML Controls Panel */}
            {mlPanelOpen && (
            <div style={{ 
              position: 'absolute', 
              bottom: '80px', 
              right: '20px', 
              background: COLORS.whiteCard, 
              border: `2px solid ${COLORS.forestGreen}`, 
              borderRadius: '10px', 
              padding: '16px', 
              boxShadow: '0 4px 16px rgba(46, 93, 69, 0.2)',
              zIndex: 1000,
              pointerEvents: 'auto',
              width: '260px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    background: COLORS.forestGreen,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Brain className="w-3.5 h-3.5" color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.textPrimary }}>Model Predictions</div>
                    <div style={{ fontSize: '9px', color: COLORS.textSecondary, fontWeight: 600 }}>ML Analysis</div>
                  </div>
                </div>
                <button
                  onClick={() => setMlPanelOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.textSecondary,
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.borderLight; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              {/* Feature Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '8px 10px',
                  background: showPredictions ? COLORS.tintInfo : 'transparent',
                  borderRadius: '6px',
                  border: `1px solid ${showPredictions ? COLORS.info : 'transparent'}`,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp className="w-3.5 h-3.5" color={COLORS.info} />
                    Movement Paths
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showPredictions}
                    onChange={(e) => setShowPredictions(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '8px 10px',
                  background: showBehavior ? COLORS.tintSuccess : 'transparent',
                  borderRadius: '6px',
                  border: `1px solid ${showBehavior ? COLORS.success : 'transparent'}`,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity className="w-3.5 h-3.5" color={COLORS.success} />
                    Behavior States
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showBehavior}
                    onChange={(e) => setShowBehavior(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '8px 10px',
                  background: showRiskHeatmap ? COLORS.tintCritical : 'transparent',
                  borderRadius: '6px',
                  border: `1px solid ${showRiskHeatmap ? COLORS.error : 'transparent'}`,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle className="w-3.5 h-3.5" color={COLORS.error} />
                    Risk Zones
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showRiskHeatmap}
                    onChange={(e) => setShowRiskHeatmap(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  cursor: 'pointer',
                  padding: '8px 10px',
                  background: showEnvLayers ? COLORS.tintSuccess : 'transparent',
                  borderRadius: '6px',
                  border: `1px solid ${showEnvLayers ? COLORS.success : 'transparent'}`,
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers className="w-3.5 h-3.5" color={COLORS.success} />
                    Environment
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showEnvLayers}
                    onChange={(e) => setShowEnvLayers(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </label>
              </div>

              {/* Temporal Controls */}
              <div style={{ 
                borderTop: `1px solid ${COLORS.borderLight}`, 
                paddingTop: '12px',
                marginTop: '4px'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: COLORS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Timeline
                </div>

                {/* Playback Controls */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <button
                    onClick={() => setTimelinePosition(prev => Math.max(prev - 6, -24))}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: COLORS.secondaryBg,
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.creamBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.secondaryBg; }}
                  >
                    <SkipBack className="w-3.5 h-3.5 mx-auto" />
                  </button>
                  
                  <button
                    onClick={() => setPlaybackActive(!playbackActive)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: playbackActive ? COLORS.forestGreen : COLORS.secondaryBg,
                      border: `1px solid ${playbackActive ? COLORS.forestGreen : COLORS.borderLight}`,
                      borderRadius: '5px',
                      cursor: 'pointer',
                      color: playbackActive ? COLORS.white : COLORS.textPrimary,
                      transition: 'all 0.2s',
                      boxShadow: playbackActive ? '0 2px 6px rgba(46, 93, 69, 0.3)' : 'none'
                    }}
                  >
                    {playbackActive ? <Pause className="w-4 h-4 mx-auto" color="white" /> : <Play className="w-4 h-4 mx-auto" />}
                  </button>
                  
                  <button
                    onClick={() => setTimelinePosition(prev => Math.min(prev + 6, 24))}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: COLORS.secondaryBg,
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.creamBg; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.secondaryBg; }}
                  >
                    <SkipForward className="w-3.5 h-3.5 mx-auto" />
                  </button>
            </div>

                {/* Time Slider */}
                <input 
                  type="range" 
                  min="-24" 
                  max="24" 
                  value={timelinePosition}
                  onChange={(e) => setTimelinePosition(parseInt(e.target.value))}
                  style={{ 
                    width: '100%', 
                    height: '5px', 
                    marginBottom: '8px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ 
                  fontSize: '10px', 
                  color: COLORS.textSecondary, 
                  textAlign: 'center',
                  fontWeight: 600,
                  padding: '5px',
                  background: COLORS.secondaryBg,
                  borderRadius: '4px'
                }}>
                  {timelinePosition === 0 ? 'Live' : 
                   timelinePosition < 0 ? `${Math.abs(timelinePosition)}h ago` : 
                   `+${timelinePosition}h`}
                </div>
              </div>
            </div>
            )}
            
            {/* ML Panel Toggle Button */}
            {!mlPanelOpen && (
              <button
                onClick={() => setMlPanelOpen(true)}
                style={{
                  position: 'absolute',
                  bottom: '80px',
                  right: '20px',
                  background: COLORS.forestGreen,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: COLORS.white,
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(46, 93, 69, 0.3)',
                  zIndex: 1000,
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.forestGreen; }}
              >
                <Brain className="w-3.5 h-3.5" />
                ML
              </button>
            )}
      </div>

          {/* Animals Panel (Right Side) */}
          <div style={{
            width: panelCollapsed ? 0 : '420px',
            background: COLORS.whiteCard,
            borderLeft: `2px solid ${COLORS.borderLight}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.3s ease',
            flexShrink: 0,
            height: '100%'
          }}>
            {!panelCollapsed && (
              <>
                {/* Panel Header */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.borderLight}`, flexShrink: 0 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '12px' }}>
                    Tracked Animals
                  </h3>
                  {/* Search Box */}
                  <div style={{ position: 'relative' }}>
                    <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSecondary }} />
                    <input
                      type="text"
                      placeholder="Search animals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        border: `1px solid ${COLORS.borderLight}`,
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        background: COLORS.secondaryBg,
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = COLORS.forestGreen;
                        e.currentTarget.style.background = COLORS.whiteCard;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = COLORS.borderLight;
                        e.currentTarget.style.background = COLORS.secondaryBg;
                      }}
                    />
                  </div>
                </div>

                {/* Panel Content */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', minHeight: 0 }}>
                  {searchFilteredAnimals.map((animal) => {
                    const batteryColor = getBatteryColor(animal.battery);
                    const accentColor = animal.risk === 'High' ? COLORS.error :
                                     animal.risk === 'Medium' ? COLORS.ochre : COLORS.success;

                    return (
                      <div
                        key={animal.id}
                        onClick={() => setSelectedAnimal(animal)}
                        style={{
                          background: selectedAnimal?.id === animal.id ? COLORS.whiteCard : COLORS.secondaryBg,
                          border: `1px solid ${selectedAnimal?.id === animal.id ? COLORS.borderMedium : COLORS.borderLight}`,
                          borderRadius: '8px',
                          padding: '16px',
                          marginBottom: '12px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = COLORS.whiteCard;
                          e.currentTarget.style.borderColor = COLORS.borderMedium;
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedAnimal?.id !== animal.id) {
                            e.currentTarget.style.background = COLORS.secondaryBg;
                            e.currentTarget.style.borderColor = COLORS.borderLight;
                          }
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        {/* Left Accent */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          borderRadius: '8px 0 0 8px',
                          background: accentColor
                        }}></div>

                        {/* Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          {/* Animal Info */}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ fontSize: '32px' }}>{animal.icon}</div>
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '2px' }}>
                                {animal.name}
                              </div>
                              <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginBottom: '2px' }}>
                                {animal.species}
                              </div>
                              <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500 }}>
                                {animal.id}
                              </div>
                            </div>
                          </div>
                          {/* Status Indicator */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: COLORS.burntOrange }}>
                            <Activity className="w-3.5 h-3.5" />
                            {animal.status}
                          </div>
                        </div>

                        {/* Card Metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px', fontWeight: 500 }}>
                              Location
                            </div>
                            <div style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600 }}>
                              {animal.location}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px', fontWeight: 500 }}>
                              Last Seen
                            </div>
                            <div style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: 600 }}>
                              {animal.lastSeen}
                            </div>
                          </div>
                        </div>

                        {/* Battery Bar */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500 }}>
                              Battery
                            </div>
                            <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500 }}>
                              {animal.battery}%
                            </div>
                          </div>
                          <div style={{
                            height: '6px',
                            background: COLORS.borderLight,
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${animal.battery}%`,
                              background: batteryColor,
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }}></div>
        </div>
      </div>

                        {/* Card Footer */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAnimal(animal);
                            }}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: COLORS.burntOrange,
                              border: 'none',
                              color: COLORS.white,
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
                          >
                            Track
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('More options for', animal.id);
                            }}
                            style={{
                              padding: '8px 12px',
                              background: 'transparent',
                              border: `1px solid ${COLORS.borderLight}`,
                              color: COLORS.textSecondary,
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.borderMedium; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
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

export default WildlifeTracking;
