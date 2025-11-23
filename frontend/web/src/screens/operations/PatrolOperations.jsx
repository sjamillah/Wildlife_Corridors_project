import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Clock, Route, CheckCircle, AlertTriangle, Search, Navigation, X, Play, Square, Plus, Trash2 } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import MapComponent from '@/components/shared/MapComponent';
import { COLORS } from '../../constants/Colors';
import { auth, rangers as rangersService, alerts as alertsService } from '../../services';
import { useWebSocket } from '@/hooks/useWebSocket';

const PatrolOperations = () => {
  const [selectedPatrol, setSelectedPatrol] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const [showPatrolDetails, setShowPatrolDetails] = useState(false);
  const [trackingPatrols, setTrackingPatrols] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [rangers, setRangers] = useState([]);
  const [patrols, setPatrols] = useState([]);
  const [trackedRangers, setTrackedRangers] = useState([]); // Rangers to show on map when tracking
  const [newTeam, setNewTeam] = useState({
    name: '',
    leader: null,
    members: [], // Array of ranger IDs
    objectives: '',
    equipment: ''
  });
  const [availableRangers, setAvailableRangers] = useState([]);
  const [loadingRangers, setLoadingRangers] = useState(false);
  const [alertMarkers, setAlertMarkers] = useState([]);
  const [deletingTeamId, setDeletingTeamId] = useState(null);
  const navigate = useNavigate();

  // WebSocket for real-time ranger position updates
  useWebSocket({
    autoConnect: true,
    onPositionUpdate: (data) => {
      // Update ranger positions in real-time
      if (data.rangers && Array.isArray(data.rangers)) {
        setRangers(prevRangers => {
          const updatedRangers = [...prevRangers];
          data.rangers.forEach(updatedRanger => {
            const index = updatedRangers.findIndex(r => r.id === updatedRanger.id);
            if (index >= 0) {
              updatedRangers[index] = { ...updatedRangers[index], ...updatedRanger };
            } else {
              updatedRangers.push(updatedRanger);
            }
          });
          return updatedRangers;
        });
      }
    }
  });

  // Fetch available rangers for team creation
  const fetchAvailableRangers = useCallback(async () => {
    try {
      setLoadingRangers(true);
      const rangersData = await rangersService.getAll();
      const rangersList = Array.isArray(rangersData) ? rangersData : (rangersData.results || rangersData.data || []);
      setAvailableRangers(rangersList);
    } catch (error) {
      console.error('Failed to fetch available rangers:', error);
      setAvailableRangers([]);
    } finally {
      setLoadingRangers(false);
    }
  }, []);

  // Fetch alerts from endpoint
  const fetchAlerts = useCallback(async () => {
    try {
      // Fetch ALL alerts from API (not just active) to include mobile-created alerts
      const data = await alertsService.getAll(); // No status filter to get all alerts
      const alertsData = data.results || data || [];
      console.log('PatrolOperations: Fetched alerts:', alertsData.length);
      
      // Transform alerts to map markers
      const markers = alertsData
        .filter(alert => {
          const lat = alert.latitude;
          const lon = alert.longitude;
          const coords = alert.coordinates || [lat, lon] || [0, 0];
          const finalLat = lat || (Array.isArray(coords) ? coords[0] : coords.lat || 0);
          const finalLon = lon || (Array.isArray(coords) ? coords[1] : coords.lon || 0);
          return finalLat !== 0 && finalLon !== 0 && 
                 finalLat >= -5 && finalLat <= 1 && 
                 finalLon >= 33 && finalLon <= 42;
        })
        .map(alert => {
          const lat = alert.latitude;
          const lon = alert.longitude;
          const coords = lat && lon ? [lat, lon] : (alert.coordinates || [0, 0]);
          const finalCoords = Array.isArray(coords) ? coords : [coords.lat || coords[0] || 0, coords.lon || coords[1] || 0];
          
          const severity = alert.severity || alert.alert_type || 'medium';
          let color = '#F59E0B';
          if (severity === 'critical') {
            color = '#DC2626';
          } else if (severity === 'high') {
            color = '#EA580C';
          } else if (severity === 'low') {
            color = '#3B82F6';
          }
          
          let alertTitle = alert.title || alert.alert_type || 'Alert';
          if (alert.alert_type && !alert.title) {
            alertTitle = alert.alert_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (!alertTitle.toLowerCase().includes('alert')) {
              alertTitle += ' Alert';
            }
          }
          
          return {
            id: `alert-${alert.id}`,
            position: finalCoords,
            type: 'alert',
            title: alertTitle,
            description: alert.message || alert.description || '',
            message: alert.message || alert.description || '',
            color: color,
            severity: severity,
            alert_type: alert.alert_type || alert.type || 'high_risk_zone',
            animalId: alert.animal || alert.animal_id,
            animalName: alert.animal_name,
            conflictZoneName: alert.conflict_zone_name,
            timestamp: alert.detected_at || alert.timestamp || alert.created_at,
            status: alert.status || 'active',
            source: alert.source || (alert.alert_type === 'emergency' ? 'mobile' : 'system')
          };
        });
      
      setAlertMarkers(markers);
      console.log('PatrolOperations: Created', markers.length, 'alert markers');
    } catch (error) {
      console.warn('PatrolOperations: Alerts unavailable:', error.message);
      setAlertMarkers([]);
    }
  }, []);

  // Fetch all data from database
  const fetchData = useCallback(async () => {
    try {
      // Fetch teams, routes, patrol logs, and ranger live status in parallel
      const [teamsData, routesData, logsData, rangersLiveStatus] = await Promise.all([
        rangersService.teams.getAll().catch(() => ({ results: [], data: [] })),
        rangersService.routes.getAll().catch(() => ({ results: [], data: [] })),
        rangersService.logs.getAll().catch(() => ({ results: [], data: [] })),
        rangersService.getLiveStatus().catch(() => []) // Use live status endpoint
      ]);
      
      // Handle different response formats
      let teamsList = [];
      if (Array.isArray(teamsData)) {
        teamsList = teamsData;
      } else if (teamsData?.results) {
        teamsList = Array.isArray(teamsData.results) ? teamsData.results : [];
      } else if (teamsData?.data) {
        teamsList = Array.isArray(teamsData.data) ? teamsData.data : [];
      }
      
      const routesList = routesData.results || routesData.data || routesData || [];
      const logsList = logsData.results || logsData.data || logsData || [];
      const rangersList = Array.isArray(rangersLiveStatus) ? rangersLiveStatus : [];
      
      console.log('📊 Fetched from database:', {
        teams: teamsList.length,
        routes: routesList.length,
        logs: logsList.length,
        rangers: rangersList.length
      });
      console.log('📋 Teams list:', teamsList);
      
      setRangers(rangersList);
      
      // Create patrols ONLY from database teams - no hardcoded data
      const patrolsFromTeams = teamsList
        .filter(team => team && team.id) // Only include valid teams with IDs
        .map(team => {
        // Find rangers in this team (using live status format)
        const teamRangers = rangersList.filter(r => 
          (r.ranger_id && (r.team_id === team.id || r.team_name === team.name)) ||
          (r.team_id === team.id) || 
          (r.team_name === team.name) || 
          (r.team === team.name)
        );
        
        // Find active route for this team
        const activeRoute = routesList.find(r => 
          r.team_id === team.id || 
          (r.status === 'active' && r.team_name === team.name)
        );
        
        // Find recent patrol log
        const recentLog = logsList
          .filter(log => log.team_id === team.id || log.team_name === team.name)
          .sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp))[0];
        
        // Calculate team center from ranger positions (using live status format)
        let teamCoordinates = null;
        if (teamRangers.length > 0) {
          const validPositions = teamRangers
            .map(r => {
              // Handle live status format
              const position = r.current_position || {};
              const lat = position.lat || position[0] || r.last_lat;
              const lon = position.lon || position[1] || r.last_lon;
              return lat && lon ? [lat, lon] : null;
            })
            .filter(pos => pos !== null);
          
          if (validPositions.length > 0) {
            const avgLat = validPositions.reduce((sum, pos) => sum + pos[0], 0) / validPositions.length;
            const avgLon = validPositions.reduce((sum, pos) => sum + pos[1], 0) / validPositions.length;
            teamCoordinates = [avgLat, avgLon];
          }
        }
        
        return {
          id: team.id || `TEAM-${team.name.replace(/\s+/g, '-').toUpperCase()}`,
          name: team.name || '',
          team: team.name || '',
          status: activeRoute?.status === 'active' ? 'active' : 
                 recentLog?.status === 'completed' ? 'completed' : 
                 team.is_active ? 'scheduled' : 'inactive',
          priority: team.priority || recentLog?.priority || null,
          leader: team.leader_name || team.leader_name || team.leader || teamRangers[0]?.name || null,
          members: teamRangers.length > 0 ? teamRangers.map(r => r.name || r.username || 'Unknown') : [],
          startTime: activeRoute?.started_at ? 
            new Date(activeRoute.started_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) :
            null,
          expectedDuration: activeRoute?.expected_duration || team.expected_duration || null,
          currentLocation: teamRangers[0]?.current_position?.location_name || 
                          (teamRangers[0]?.current_position?.lat && teamRangers[0]?.current_position?.lon 
                            ? `${teamRangers[0].current_position.lat.toFixed(4)}, ${teamRangers[0].current_position.lon.toFixed(4)}`
                            : null) ||
                          activeRoute?.current_location || null,
          route: activeRoute?.name || activeRoute?.route_name || team.route_name || null,
          objectives: team.objectives ? (Array.isArray(team.objectives) ? team.objectives : typeof team.objectives === 'string' ? [team.objectives] : []) : (activeRoute?.objectives || []),
          equipment: team.equipment ? (Array.isArray(team.equipment) ? team.equipment : typeof team.equipment === 'string' ? [team.equipment] : []) : (activeRoute?.equipment || []),
          lastUpdate: recentLog?.created_at ? 
            new Date(recentLog.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) :
            null,
          coordinates: teamCoordinates || (team.coordinates && Array.isArray(team.coordinates) ? team.coordinates : null) || null,
          incidents: logsList.filter(log => 
            (log.team_id === team.id || log.team_name === team.name) && 
            log.log_type === 'incident'
          ).length,
          rangers: teamRangers
        };
      });
      
      setPatrols(patrolsFromTeams);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setPatrols([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAvailableRangers(); // Fetch available rangers for team creation
    fetchAlerts(); // Fetch alerts from endpoint
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchData();
      fetchAlerts(); // Refresh alerts every 30 seconds to catch mobile-created alerts
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, fetchAvailableRangers, fetchAlerts]);

  // Live tracking refresh - update ranger positions when tracking is active
  useEffect(() => {
    const activeTracking = Object.keys(trackingPatrols).filter(id => trackingPatrols[id]);
    if (activeTracking.length === 0) return;

    const refreshTracking = async () => {
      try {
        const liveStatus = await rangersService.getLiveStatus();
        const rangersList = Array.isArray(liveStatus) ? liveStatus : [];
        
        // Update tracked rangers with latest positions
        setTrackedRangers(prev => {
          const updatedRangers = prev.map(trackedRanger => {
            const liveRanger = rangersList.find(r => 
              (r.ranger_id || r.id) === (trackedRanger.ranger_id || trackedRanger.id)
            );
            
            if (liveRanger) {
              const position = liveRanger.current_position || {};
              return {
                ...trackedRanger,
                ...liveRanger,
                lat: position.lat || position[0] || liveRanger.last_lat || trackedRanger.lat,
                lon: position.lon || position[1] || liveRanger.last_lon || trackedRanger.lon,
                current_position: {
                  lat: position.lat || position[0] || liveRanger.last_lat || trackedRanger.lat,
                  lon: position.lon || position[1] || liveRanger.last_lon || trackedRanger.lon
                }
              };
            }
            return trackedRanger;
          });
          return updatedRangers;
        });
      } catch (error) {
        console.warn('Failed to refresh tracking positions:', error);
      }
    };

    // Refresh every 5 seconds when tracking is active
    const trackingInterval = setInterval(refreshTracking, 5000);
    refreshTracking(); // Initial refresh

    return () => clearInterval(trackingInterval);
  }, [trackingPatrols]);

  // Removed hardcoded patrols - only using database teams now
  /* Removed hardcoded patrols - using database teams only
  const [legacyPatrols] = useState([
    {
      id: 'PTRL-001',
      name: 'Tsavo East Perimeter',
      status: 'active',
      priority: 'high',
      team: 'KWS Unit Alpha',
      leader: 'Senior Warden Kamau',
      members: ['J. Kamau', 'M. Wanjiku', 'P. Mwangi', 'S. Achieng'],
      startTime: '06:00',
      expectedDuration: '8 hours',
      currentLocation: 'Voi Gate Section',
      route: 'Voi Gate → Aruba Dam → Mudanda Rock',
      objectives: ['Perimeter Check', 'Anti-Poaching', 'Wildlife Count'],
      equipment: ['GPS Units', 'Radios', 'First Aid', 'Camera Traps'],
      progress: 45,
      lastUpdate: '2 min ago',
      coordinates: [34.8532, -2.0891],
      incidents: 1,
      icon: '🚶‍♂️'
    },
    {
      id: 'PTRL-002',
      name: 'Village Outreach Program',
      status: 'scheduled',
      priority: 'medium',
      team: 'Beta Team',
      leader: 'Sarah Muthoni',
      members: ['S. Muthoni', 'D. Kipchoge', 'L. Wambui'],
      startTime: '09:00',
      expectedDuration: '6 hours',
      currentLocation: 'Base Station',
      route: 'Village A → School → Community Center → Village B',
      objectives: ['Education', 'Conflict Mitigation', 'Data Collection'],
      equipment: ['Educational Materials', 'Survey Forms', 'Gifts'],
      progress: 0,
      lastUpdate: '1 hour ago',
      coordinates: [34.7821, -2.1245],
      incidents: 0,
      icon: '🏫'
    },
    {
      id: 'PTRL-003',
      name: 'Emergency Response - Elephant',
      status: 'active',
      priority: 'critical',
      team: 'Charlie Team',
      leader: 'Michael Ochieng',
      members: ['M. Ochieng', 'A. Njeru', 'F. Wanjala', 'G. Kiprotich'],
      startTime: '14:30',
      expectedDuration: '4 hours',
      currentLocation: 'Village X Outskirts',
      route: 'Emergency Response → Herd Location → Safe Corridor',
      objectives: ['Animal Relocation', 'Public Safety', 'Damage Assessment'],
      equipment: ['Deterrent Equipment', 'Emergency Kit', 'Communication Gear'],
      progress: 75,
      lastUpdate: '5 min ago',
      coordinates: [34.8901, -2.0672],
      incidents: 2,
      icon: 'AlertTriangle'
    },
    {
      id: 'PTRL-004',
      name: 'Camera Trap Maintenance',
      status: 'completed',
      priority: 'low',
      team: 'Delta Team',
      leader: 'Grace Njoki',
      members: ['G. Njoki', 'T. Mutua'],
      startTime: '07:00',
      expectedDuration: '5 hours',
      currentLocation: 'Base Station',
      route: 'Trap Site 1 → Trap Site 2 → Trap Site 3',
      objectives: ['Equipment Check', 'Data Download', 'Battery Replacement'],
      equipment: ['Tools', 'Batteries', 'SD Cards', 'Cleaning Kit'],
      progress: 100,
      lastUpdate: '2 hours ago',
      coordinates: [34.8234, -2.1089],
      incidents: 0,
      icon: '📷'
    },
    {
      id: 'PTRL-005',
      name: 'Night Surveillance',
      status: 'scheduled',
      priority: 'high',
      team: 'Echo Team',
      leader: 'Robert Maina',
      members: ['R. Maina', 'C. Wafula', 'J. Kibet'],
      startTime: '20:00',
      expectedDuration: '10 hours',
      currentLocation: 'Base Station',
      route: 'Hot Spot Alpha → Hot Spot Beta → Hot Spot Gamma',
      objectives: ['Anti-Poaching', 'Night Movement Monitoring', 'Deterrent Patrol'],
      equipment: ['Night Vision', 'Thermal Cameras', 'Silent Radios', 'Emergency Flares'],
      progress: 0,
      lastUpdate: '30 min ago',
      coordinates: [34.7956, -2.0934],
      incidents: 0,
      icon: '🌙'
    }
  ]);
  */

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

  const handleTrackPatrol = async (patrol, e) => {
    e.stopPropagation();
    if (trackingPatrols[patrol.id]) {
      // Stop tracking - remove rangers from map
      setTrackingPatrols(prev => ({ ...prev, [patrol.id]: false }));
      setTrackedRangers(prev => prev.filter(r => {
        const rangerId = r.ranger_id || r.id;
        return !patrol.rangers?.some(pr => (pr.ranger_id || pr.id) === rangerId);
      }));
      console.log('Stopped tracking patrol:', patrol.id);
    } else {
      // Start tracking - fetch live ranger positions and add to map
      setTrackingPatrols(prev => ({ ...prev, [patrol.id]: true }));
      
      try {
        // Fetch latest live status for all rangers
        const liveStatus = await rangersService.getLiveStatus();
        const rangersList = Array.isArray(liveStatus) ? liveStatus : [];
        
        // Get ranger IDs from the patrol team
        const teamRangerIds = new Set();
        if (patrol.rangers && patrol.rangers.length > 0) {
          patrol.rangers.forEach(r => {
            const id = r.ranger_id || r.id;
            if (id) teamRangerIds.add(id);
          });
        }
        
        // Filter rangers that belong to this team and have positions
        const rangersToTrack = rangersList
          .filter(r => {
            const rangerId = r.ranger_id || r.id;
            const belongsToTeam = teamRangerIds.has(rangerId);
            const position = r.current_position || {};
            const hasPosition = position.lat || position[0] || r.last_lat;
            return belongsToTeam && hasPosition;
          })
          .map(r => {
            const position = r.current_position || {};
            return {
              ...r,
              ranger_id: r.ranger_id || r.id,
              lat: position.lat || position[0] || r.last_lat,
              lon: position.lon || position[1] || r.last_lon,
              current_position: {
                lat: position.lat || position[0] || r.last_lat,
                lon: position.lon || position[1] || r.last_lon
              }
            };
          });
        
        setTrackedRangers(prev => {
          const existingIds = new Set(prev.map(r => r.ranger_id || r.id));
          const newRangers = rangersToTrack.filter(r => !existingIds.has(r.ranger_id || r.id));
          return [...prev, ...newRangers];
        });
        
        // Show map if not already visible
        if (!showMap) {
          setShowMap(true);
        }
        
        console.log('Started tracking patrol:', patrol.id, 'with', rangersToTrack.length, 'rangers');
      } catch (error) {
        console.error('Failed to fetch live ranger positions:', error);
        // Fallback to using patrol.rangers if live status fails
        if (patrol.rangers && patrol.rangers.length > 0) {
          const rangersToTrack = patrol.rangers
            .filter(r => {
              const position = r.current_position || {};
              const hasPosition = position.lat || position[0] || r.last_lat;
              return hasPosition;
            })
            .map(r => {
              const position = r.current_position || {};
              return {
                ...r,
                ranger_id: r.ranger_id || r.id,
                lat: position.lat || position[0] || r.last_lat,
                lon: position.lon || position[1] || r.last_lon
              };
            });
          setTrackedRangers(prev => {
            const existingIds = new Set(prev.map(r => r.ranger_id || r.id));
            const newRangers = rangersToTrack.filter(r => !existingIds.has(r.ranger_id || r.id));
            return [...prev, ...newRangers];
          });
          if (!showMap) {
            setShowMap(true);
          }
        }
      }
    }
  };

  const handlePatrolDetails = (patrol, e) => {
    e.stopPropagation();
    setSelectedPatrol(patrol);
    setShowPatrolDetails(true);
  };

  const handleDeleteTeam = async (patrol, e) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete the team "${patrol.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingTeamId(patrol.id);
      await rangersService.teams.delete(patrol.id);
      
      // Refresh the data
      await fetchData();
      
      alert('Team deleted successfully!');
    } catch (error) {
      console.error('Failed to delete team:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to delete team. Please check if the team has active patrols or routes.';
      alert(`Failed to delete team: ${errorMessage}`);
    } finally {
      setDeletingTeamId(null);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name || !newTeam.leader) {
      alert('Please fill in team name and select a leader');
      return;
    }

    try {
      // Parse objectives and equipment from text (split by newlines)
      const objectives = newTeam.objectives 
        ? newTeam.objectives.split('\n').filter(obj => obj.trim()).map(obj => obj.trim())
        : [];
      
      const equipment = newTeam.equipment 
        ? newTeam.equipment.split('\n').filter(eq => eq.trim()).map(eq => eq.trim())
        : [];
      
      // Remove leader from members if they were accidentally selected
      const members = newTeam.members.filter(id => id !== newTeam.leader);
      
      // Prepare team data
      const teamData = {
        name: newTeam.name.trim(),
        leader: newTeam.leader,
        members: members, // Array of ranger IDs (excluding leader)
        objectives: objectives,
        equipment: equipment,
        is_active: true
      };
      
      console.log('Creating team with data:', teamData);
      const createdTeam = await rangersService.teams.create(teamData);
      console.log('Team created successfully:', createdTeam);
      
      // Close modal and reset form first
      setShowCreateTeamModal(false);
      setNewTeam({
        name: '',
        leader: null,
        members: [],
        objectives: '',
        equipment: ''
      });
      
      // Switch to 'all' view to ensure the newly created team is visible
      // (new teams have status 'scheduled', so they won't show in 'active' view)
      setViewMode('all');
      
      // Small delay to ensure backend has processed the creation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh teams list
      console.log('Refreshing teams list...');
      await fetchData();
      
      alert('Team created successfully!');
    } catch (error) {
      console.error('Failed to create team:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to create team: ${error.response?.data?.message || error.response?.data?.detail || error.message || 'Unknown error'}`);
    }
  };

  const handleRangerSelection = (rangerId, isLeader = false) => {
    if (isLeader) {
      // When selecting a leader, remove them from members if they were there
      const members = newTeam.members.filter(id => id !== rangerId);
      setNewTeam({ ...newTeam, leader: rangerId, members });
    } else {
      const members = newTeam.members.includes(rangerId)
        ? newTeam.members.filter(id => id !== rangerId)
        : [...newTeam.members, rangerId];
      setNewTeam({ ...newTeam, members });
    }
  };

  const allPatrols = patrols.length > 0 ? patrols : [];
  
  const filteredPatrols = allPatrols.filter(patrol => {
    const matchesSearch = patrol.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patrol.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patrol.team?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = viewMode === 'all' || patrol.status === viewMode;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate stats from database data
  const statusCounts = useMemo(() => {
    const allPatrolsList = patrols.length > 0 ? patrols : [];
    return {
      all: allPatrolsList.length,
      active: allPatrolsList.filter(p => p.status === 'active').length,
      scheduled: allPatrolsList.filter(p => p.status === 'scheduled').length,
      completed: allPatrolsList.filter(p => p.status === 'completed').length
    };
  }, [patrols]);

  const priorityCounts = useMemo(() => {
    const allPatrolsList = patrols.length > 0 ? patrols : [];
    return {
      critical: allPatrolsList.filter(p => p.priority === 'critical').length,
      high: allPatrolsList.filter(p => p.priority === 'high').length,
      medium: allPatrolsList.filter(p => p.priority === 'medium').length,
      low: allPatrolsList.filter(p => p.priority === 'low').length
    };
  }, [patrols]);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div className="responsive-content">
        {/* Page Header */}
        <section style={{ background: COLORS.forestGreen, padding: '28px 40px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: COLORS.white, marginBottom: '6px', letterSpacing: '-0.6px' }}>
              Patrol Operations
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Coordinate field teams and missions
            </p>
            </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Stats badges */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: COLORS.white, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users className="w-4 h-4" />
              Teams: {statusCounts.all} | Rangers: {rangers.length}
                </div>
            {priorityCounts.critical > 0 && (
            <div style={{ background: COLORS.error, padding: '8px 16px', borderRadius: '6px', color: COLORS.white, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle className="w-4 h-4" />
              Critical: {priorityCounts.critical}
              </div>
            )}
            {/* Action buttons - better styled */}
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                onClick={() => setShowMap(!showMap)}
                style={{
                  background: showMap ? COLORS.white : 'rgba(255, 255, 255, 0.2)',
                  border: `1px solid ${showMap ? COLORS.forestGreen : 'rgba(255, 255, 255, 0.3)'}`,
                  color: showMap ? COLORS.forestGreen : COLORS.white,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { 
                  if (!showMap) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => { 
                  if (!showMap) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
              >
                <Navigation className="w-4 h-4" />
                {showMap ? 'Hide Map' : 'Map'}
              </button>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                style={{
                  background: COLORS.burntOrange,
                  border: `1px solid ${COLORS.burntOrange}`,
                  color: COLORS.white,
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.background = COLORS.terracotta; 
                  e.currentTarget.style.borderColor = COLORS.terracotta; 
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.background = COLORS.burntOrange; 
                  e.currentTarget.style.borderColor = COLORS.burntOrange; 
                }}
              >
                <Plus className="w-4 h-4" />
                New Team
              </button>
                </div>
            </div>
        </section>

        {/* Status Overview Bar */}
        <section style={{ background: COLORS.secondaryBg, padding: '20px 40px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <div style={{ display: 'flex', gap: '2px', background: COLORS.borderLight, borderRadius: '8px', overflow: 'hidden', height: '70px' }}>
            {/* Active Patrols */}
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
            onClick={() => setViewMode('active')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.forestGreen, marginBottom: '4px' }}>
                {statusCounts.active}
                </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Active Patrols
                </div>
              </div>

            {/* Scheduled Today */}
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
            onClick={() => setViewMode('scheduled')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.forestGreen, marginBottom: '4px' }}>
                {statusCounts.scheduled}
            </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Scheduled Today
                </div>
                </div>

            {/* Critical Missions */}
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
                {priorityCounts.critical}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Critical Missions
            </div>
                </div>

            {/* Completed Today */}
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
            onClick={() => setViewMode('completed')}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: COLORS.success, marginBottom: '4px' }}>
                {statusCounts.completed}
                </div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.textSecondary }}>
                Completed Today
              </div>
            </div>
                </div>
        </section>

        {/* Map Section */}
        {showMap && (
          <section style={{ padding: '20px 40px', background: COLORS.secondaryBg, borderBottom: `1px solid ${COLORS.borderLight}` }}>
            <div style={{ height: '500px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${COLORS.borderLight}`, background: COLORS.whiteCard, position: 'relative' }}>
              {trackedRangers.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  zIndex: 1000,
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: COLORS.success,
                    animation: 'pulse 2s infinite'
                  }}></div>
                  Live Tracking: {trackedRangers.length} {trackedRangers.length === 1 ? 'Ranger' : 'Rangers'}
                </div>
              )}
              <MapComponent
                markers={[
                  ...trackedRangers
                    .filter(ranger => {
                      const lat = ranger.lat || ranger.current_position?.lat || ranger.current_position?.[0] || ranger.last_lat;
                      const lon = ranger.lon || ranger.current_position?.lon || ranger.current_position?.[1] || ranger.last_lon;
                      return lat && lon;
                    })
                  .map(ranger => {
                    const lat = ranger.lat || ranger.current_position?.lat || ranger.current_position?.[0] || ranger.last_lat;
                    const lon = ranger.lon || ranger.current_position?.lon || ranger.current_position?.[1] || ranger.last_lon;
                    
                    // Get location status and source from live status
                    const locationStatus = ranger.current_position?.status || 'live';
                    const locationSource = ranger.location_source || 'automatic_tracking';
                    const isStale = ranger.current_position?.is_stale || false;
                    const minutesSinceUpdate = ranger.current_position?.minutes_since_update || 0;
                    
                    return {
                      id: ranger.ranger_id || ranger.id,
                      title: ranger.name || ranger.username || 'Ranger',
                      position: [lat, lon],
                      type: 'ranger',
                      color: ranger.current_status === 'on_duty' ? COLORS.info : COLORS.textSecondary,
                      activityType: ranger.activity_type || (ranger.current_status === 'on_duty' ? 'patrolling' : 'off_duty'),
                      speed: ranger.speed_kmh || 0,
                      team: ranger.team_name || ranger.team || 'Unassigned',
                      badge: ranger.badge_number || '',
                      status: ranger.current_status || 'unknown',
                      // Live status fields
                      locationStatus,
                      locationSource,
                      isStale,
                      minutesSinceUpdate,
                      hasAutomaticTracking: ranger.has_automatic_tracking || false,
                      hasManualCheckpoint: ranger.has_manual_checkpoint || false,
                      recentLogs: ranger.recent_logs || []
                    };
                  }),
                  ...alertMarkers
                ]}
                rangerPatrols={trackedRangers
                  .filter(ranger => {
                    const lat = ranger.lat || ranger.current_position?.lat || ranger.current_position?.[0] || ranger.last_lat;
                    const lon = ranger.lon || ranger.current_position?.lon || ranger.current_position?.[1] || ranger.last_lon;
                    return lat && lon;
                  })
                  .map(ranger => {
                    const lat = ranger.lat || ranger.current_position?.lat || ranger.current_position?.[0] || ranger.last_lat;
                    const lon = ranger.lon || ranger.current_position?.lon || ranger.current_position?.[1] || ranger.last_lon;
                    
                    return {
                      id: ranger.ranger_id || ranger.id,
                      name: ranger.name || ranger.username || 'Ranger',
                      team_name: ranger.team_name || ranger.team || 'Unassigned',
                      status: ranger.current_status || 'active',
                      current_position: { lat, lon },
                      activity: ranger.activity_type || 'patrolling',
                      badge: ranger.badge_number || '',
                      // Live status fields
                      locationStatus: ranger.current_position?.status || 'live',
                      locationSource: ranger.location_source || 'automatic_tracking',
                      isStale: ranger.current_position?.is_stale || false,
                      minutesSinceUpdate: ranger.current_position?.minutes_since_update || 0
                    };
                  })}
                showRangerPatrols={trackedRangers.length > 0}
                showAnimalMovement={false}
                showCorridors={true}
                showRiskZones={true}
                showPredictions={false}
                showBehaviorStates={false}
                showEnvironment={false}
                corridors={[]}
                riskZones={[]}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </section>
        )}

        {/* Patrols Section */}
        <section style={{ padding: '32px 40px' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.textPrimary }}>Patrols</h2>
            {/* Search Filter Row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, maxWidth: '600px', marginLeft: 'auto' }}>
              {/* Search Box */}
              <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                <Search className="w-4 h-4" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textSecondary }} />
                  <input
                    type="text"
                    placeholder="Search missions, teams, objectives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    background: COLORS.whiteCard,
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
                  />
                </div>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'active', 'scheduled', 'completed'].map((filter) => {
                  const isActive = viewMode === filter;
                  const label = filter === 'all' ? 'All' :
                               filter === 'active' ? 'Active' :
                               filter === 'scheduled' ? 'Scheduled' : 'Completed';

                  return (
                    <button
                      key={filter}
                      onClick={() => setViewMode(filter)}
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
            </div>

          {/* Patrol Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: '24px' }}>
            {filteredPatrols.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 20px',
                background: COLORS.whiteCard,
                borderRadius: '12px',
                border: `2px dashed ${COLORS.borderLight}`
              }}>
                <Users className="w-16 h-16" style={{ margin: '0 auto 20px', color: COLORS.textSecondary, opacity: 0.5 }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                  No Teams Found
                </h3>
                <p style={{ fontSize: '14px', color: COLORS.textSecondary, marginBottom: '24px' }}>
                  {searchQuery ? `No teams match "${searchQuery}"` : 'Create your first team to get started'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateTeamModal(true)}
                    style={{
                      padding: '12px 24px',
                      background: COLORS.burntOrange,
                      border: 'none',
                      color: COLORS.white,
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
                  >
                    <Plus className="w-4 h-4" style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    Create Team
                  </button>
                )}
              </div>
            ) : (
              filteredPatrols.map((patrol) => {
              const accentColor = patrol.priority === 'critical' ? COLORS.error :
                                 patrol.priority === 'high' ? COLORS.ochre : COLORS.forestGreen;

              return (
                <div
                  key={patrol.id}
                  onClick={() => setSelectedPatrol(patrol)}
                  style={{
                    background: COLORS.whiteCard,
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: '10px',
                    padding: '24px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderMedium;
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Top Accent */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    borderRadius: '10px 10px 0 0',
                    background: accentColor
                  }}></div>

                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    {/* Patrol Title Section */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      {/* Icon */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: patrol.priority === 'critical' ? COLORS.tintCritical : COLORS.tintRangers
                      }}>
                        <Users className="w-6 h-6" style={{ color: patrol.priority === 'critical' ? COLORS.error : COLORS.forestGreen }} />
                        </div>
                      {/* Title info */}
                        <div>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '4px' }}>
                          {patrol.name}
                        </div>
                        <div style={{ fontSize: '12px', color: COLORS.textSecondary, fontWeight: 500 }}>
                          {patrol.id}
                      </div>
                      </div>
                    </div>
                    {/* Card Badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={(e) => handleDeleteTeam(patrol, e)}
                          disabled={deletingTeamId === patrol.id}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: `1px solid ${COLORS.borderLight}`,
                            borderRadius: '4px',
                            cursor: deletingTeamId === patrol.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: deletingTeamId === patrol.id ? 0.5 : 1,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (deletingTeamId !== patrol.id) {
                              e.currentTarget.style.borderColor = COLORS.error;
                              e.currentTarget.style.background = COLORS.tintCritical;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (deletingTeamId !== patrol.id) {
                              e.currentTarget.style.borderColor = COLORS.borderLight;
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: COLORS.error }} />
                        </button>
                      </div>
                      {/* Status */}
                      <span style={{
                        padding: '5px 12px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: patrol.status === 'active' ? COLORS.tintRangers :
                                   patrol.status === 'scheduled' ? COLORS.tintRangers : COLORS.tintSuccess,
                        color: patrol.status === 'active' ? COLORS.forestGreen :
                              patrol.status === 'scheduled' ? COLORS.forestGreen : COLORS.success
                      }}>
                        {patrol.status}
                        </span>
                      {/* Priority */}
                      {patrol.priority && (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: patrol.priority === 'critical' ? COLORS.error :
                                     patrol.priority === 'high' ? COLORS.ochre :
                                     patrol.priority === 'medium' ? COLORS.warning : COLORS.textSecondary,
                          color: COLORS.white
                        }}>
                          {patrol.priority}
                        </span>
                      )}
                      </div>
                    </div>

                  {/* Card Details */}
                  <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: COLORS.textPrimary }}>
                      <Users className="w-4 h-4" style={{ width: '20px', minWidth: '20px', color: COLORS.forestGreen, flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>
                          {patrol.team || 'Unnamed Team'}
                        </span>
                        <span style={{ fontWeight: 500, color: COLORS.textSecondary, fontSize: '12px' }}>
                          Leader: {patrol.leader || 'Not assigned'}
                          {patrol.rangers && patrol.rangers.length > 0 && (
                            <span style={{ marginLeft: '8px' }}>
                              • {patrol.rangers.length} {patrol.rangers.length === 1 ? 'member' : 'members'}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    {patrol.currentLocation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: COLORS.textPrimary }}>
                        <MapPin className="w-4 h-4" style={{ width: '20px', minWidth: '20px', color: COLORS.ochre, flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>Current Location</span>
                          <span style={{ fontWeight: 500, color: COLORS.textSecondary, fontSize: '12px' }}>
                            {patrol.currentLocation}
                            {patrol.coordinates && (
                              <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>
                                ({patrol.coordinates[0]?.toFixed(4)}, {patrol.coordinates[1]?.toFixed(4)})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                    {(patrol.startTime || patrol.expectedDuration) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: COLORS.textPrimary }}>
                        <Clock className="w-4 h-4" style={{ width: '20px', minWidth: '20px', color: COLORS.info, flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>Schedule</span>
                          <span style={{ fontWeight: 500, color: COLORS.textSecondary, fontSize: '12px' }}>
                            {patrol.startTime ? `Start: ${patrol.startTime}` : 'Not scheduled'}
                            {patrol.expectedDuration && ` • Duration: ${patrol.expectedDuration}`}
                          </span>
                        </div>
                      </div>
                    )}
                    {patrol.route && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: COLORS.textPrimary }}>
                        <Route className="w-4 h-4" style={{ width: '20px', minWidth: '20px', color: COLORS.burntOrange, flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>Route</span>
                          <span style={{ fontWeight: 500, color: COLORS.textSecondary, fontSize: '12px' }}>
                            {patrol.route}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                      
                  {/* Team Avatars */}
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${COLORS.creamBg}` }}>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      Team {patrol.rangers && patrol.rangers.length > 0 ? `(${patrol.rangers.length} ${patrol.rangers.length === 1 ? 'ranger' : 'rangers'})` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(patrol.rangers && patrol.rangers.length > 0 ? patrol.rangers : patrol.members || []).slice(0, 8).map((member, idx) => {
                        const memberName = typeof member === 'string' ? member : (member.name || member.username || 'Unknown');
                        const initials = memberName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
                        return (
                        <div
                          key={idx}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            marginLeft: idx === 0 ? 0 : '-8px',
                            background: idx === 0 ? COLORS.burntOrange :
                                       idx === 1 ? COLORS.forestGreen :
                                       idx === 2 ? COLORS.ochre :
                                         idx === 3 ? COLORS.info : 
                                         idx === 4 ? COLORS.burntOrange :
                                         idx === 5 ? COLORS.forestGreen :
                                         idx === 6 ? COLORS.ochre : COLORS.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                              fontSize: '10px',
                              fontWeight: 700,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                            title={memberName}
                          >
                            {initials}
                          </div>
                        );
                      })}
                      {(patrol.rangers && patrol.rangers.length > 8) && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '2px solid white',
                          marginLeft: '-8px',
                          background: COLORS.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 700
                        }}>
                          +{patrol.rangers.length - 8}
                        </div>
                      )}
                      </div>
                    </div>

                  {/* Objectives Section */}
                    {patrol.objectives && patrol.objectives.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        Objectives
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: COLORS.textPrimary }}>
                        {patrol.objectives.map((obj, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            padding: '6px 12px',
                            background: COLORS.secondaryBg,
                            borderRadius: '6px',
                            border: `1px solid ${COLORS.borderLight}`
                          }}>
                            <CheckCircle className="w-3 h-3" style={{ color: COLORS.success }} />
                            {obj}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}

                  {/* Equipment Section */}
                  {patrol.equipment && patrol.equipment.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        Equipment
                        </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: COLORS.textPrimary }}>
                        {patrol.equipment.map((eq, idx) => (
                          <div key={idx} style={{ 
                            padding: '6px 12px',
                            background: COLORS.secondaryBg,
                            borderRadius: '6px',
                            border: `1px solid ${COLORS.borderLight}`
                          }}>
                            {eq}
                        </div>
                        ))}
                      </div>
                        </div>
                  )}

                  {/* Full Members List */}
                  {patrol.members && patrol.members.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        All Team Members
                          </div>
                      <div style={{ fontSize: '12px', color: COLORS.textPrimary, lineHeight: '1.6' }}>
                        {patrol.members.map((member, idx) => (
                          <span key={idx}>
                            {member}{idx < patrol.members.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                      <button 
                        onClick={(e) => handleTrackPatrol(patrol, e)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: trackingPatrols[patrol.id] ? COLORS.success : COLORS.burntOrange,
                        border: 'none',
                        color: COLORS.white,
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.background = trackingPatrols[patrol.id] ? '#059669' : COLORS.terracotta; 
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.background = trackingPatrols[patrol.id] ? COLORS.success : COLORS.burntOrange; 
                      }}
                      >
                        {trackingPatrols[patrol.id] ? (
                          <>
                            <Square className="w-4 h-4" />
                            Stop Tracking
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                          Track
                          </>
                        )}
                      </button>
                      <button 
                        onClick={(e) => handlePatrolDetails(patrol, e)}
                      style={{
                        padding: '12px 18px',
                        background: 'transparent',
                        border: `1px solid ${COLORS.borderLight}`,
                        color: COLORS.textSecondary,
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = COLORS.forestGreen;
                        e.currentTarget.style.color = COLORS.forestGreen;
                        e.currentTarget.style.background = COLORS.secondaryBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = COLORS.borderLight;
                        e.currentTarget.style.color = COLORS.textSecondary;
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                        Details
                      </button>
                    </div>
                  {/* Time Badge */}
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, fontWeight: 500, marginTop: '8px', textAlign: 'right' }}>
                    Updated {patrol.lastUpdate}
                  </div>
                </div>
              );
              })
            )}
            </div>
        </section>
      </div>

      {/* Patrol Details Modal - Functionality preserved */}
      {showPatrolDetails && selectedPatrol && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '12px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#2E5D45', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{selectedPatrol.name}</h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{selectedPatrol.id} • {selectedPatrol.team}</p>
              </div>
              <button onClick={() => setShowPatrolDetails(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: '#EDF5F0', color: '#2E5D45' }}>
                    {selectedPatrol.status}
                  </span>
                  <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: selectedPatrol.priority === 'critical' ? '#FEF3F2' : '#FEF9E7', color: selectedPatrol.priority === 'critical' ? '#EF4444' : '#E8961C' }}>
                    {selectedPatrol.priority}
                  </span>
                </div>
                {selectedPatrol.status === 'active' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>Progress</span>
                      <span style={{ fontWeight: 700 }}>{selectedPatrol.progress}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#E8E3D6', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${selectedPatrol.progress}%`, background: '#2E5D45', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B5E4F', marginBottom: '8px' }}>Team Leader</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPatrol.leader}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B5E4F', marginBottom: '8px' }}>Location</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPatrol.currentLocation}</div>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B5E4F', marginBottom: '8px' }}>Objectives</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPatrol.objectives.map((obj, idx) => (
                    <div key={idx} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />
                      {obj}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #E8E3D6', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button
                onClick={() => setShowPatrolDetails(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid #E8E3D6',
                  borderRadius: '6px',
                  color: '#6B5E4F',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4CCBA'; e.currentTarget.style.background = '#FAFAF8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E3D6'; e.currentTarget.style.background = 'transparent'; }}
              >
                Close
              </button>
              <button
                onClick={(e) => handleTrackPatrol(selectedPatrol, e)}
                style={{
                  padding: '10px 20px',
                  background: trackingPatrols[selectedPatrol.id] ? '#EF4444' : '#D84315',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = trackingPatrols[selectedPatrol.id] ? '#DC2626' : '#BF3812'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = trackingPatrols[selectedPatrol.id] ? '#EF4444' : '#D84315'; }}
              >
                {trackingPatrols[selectedPatrol.id] ? (
                  <>
                    <Square className="w-4 h-4" />
                    Stop Tracking
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Tracking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000, 
          padding: '16px' 
        }}>
          <div style={{ 
            background: COLORS.whiteCard, 
            borderRadius: '12px', 
            maxWidth: '600px', 
            width: '100%', 
            maxHeight: '90vh', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            {/* Modal Header */}
            <div style={{ 
              background: COLORS.forestGreen, 
              padding: '24px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: COLORS.white, marginBottom: '4px' }}>
                  Create New Team
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                  Set up a new patrol team
                </p>
              </div>
              <button 
                onClick={() => setShowCreateTeamModal(false)} 
                style={{ background: 'transparent', border: 'none', color: COLORS.white, cursor: 'pointer' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Team Name */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px', display: 'block' }}>
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="e.g., Alpha Team"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
                  />
                </div>

                {/* Team Leader */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px', display: 'block' }}>
                    Team Leader *
                  </label>
                  <select
                    value={newTeam.leader || ''}
                    onChange={(e) => setNewTeam({ ...newTeam, leader: e.target.value ? parseInt(e.target.value) : null })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      background: COLORS.whiteCard,
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
                  >
                    <option value="">Select Team Leader</option>
                    {loadingRangers ? (
                      <option disabled>Loading rangers...</option>
                    ) : availableRangers.length === 0 ? (
                      <option disabled>No rangers available</option>
                    ) : (
                      availableRangers.map(ranger => (
                        <option key={ranger.id || ranger.ranger_id} value={ranger.id || ranger.ranger_id}>
                          {ranger.name || ranger.username || ranger.badge_number || 'Ranger'}
                          {ranger.badge_number ? ` (${ranger.badge_number})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Team Members */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px', display: 'block' }}>
                    Team Members
                  </label>
                  {loadingRangers ? (
                    <div style={{ padding: '12px', border: `1px solid ${COLORS.borderLight}`, borderRadius: '6px', background: COLORS.secondaryBg, textAlign: 'center', color: COLORS.textSecondary }}>
                      Loading available rangers...
                    </div>
                  ) : availableRangers.length === 0 ? (
                    <div style={{ padding: '12px', border: `1px solid ${COLORS.borderLight}`, borderRadius: '6px', background: COLORS.secondaryBg, textAlign: 'center', color: COLORS.textSecondary }}>
                      No rangers available. Please add rangers first.
                    </div>
                  ) : (
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto', 
                      border: `1px solid ${COLORS.borderLight}`, 
                      borderRadius: '6px', 
                      padding: '8px',
                      background: COLORS.whiteCard
                    }}>
                      {availableRangers.map(ranger => {
                        const rangerId = ranger.id || ranger.ranger_id;
                        const isSelected = newTeam.members.includes(rangerId);
                        const isLeader = newTeam.leader === rangerId;
                        const rangerName = ranger.name || ranger.username || ranger.badge_number || 'Ranger';
                        
                        return (
                          <div
                            key={rangerId}
                            onClick={() => {
                              if (!isLeader) { // Can't deselect if they're the leader
                                handleRangerSelection(rangerId, false);
                              }
                            }}
                            style={{
                              padding: '10px 12px',
                              marginBottom: '6px',
                              borderRadius: '6px',
                              cursor: isLeader ? 'not-allowed' : 'pointer',
                              background: isLeader ? COLORS.tintSuccess : (isSelected ? COLORS.tintRangers : COLORS.secondaryBg),
                              border: `1px solid ${isLeader ? COLORS.success : (isSelected ? COLORS.forestGreen : COLORS.borderLight)}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'all 0.2s ease',
                              opacity: isLeader ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!isLeader) {
                                e.currentTarget.style.background = isSelected ? COLORS.tintRangers : COLORS.creamBg;
                                e.currentTarget.style.borderColor = COLORS.forestGreen;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isLeader) {
                                e.currentTarget.style.background = isSelected ? COLORS.tintRangers : COLORS.secondaryBg;
                                e.currentTarget.style.borderColor = isSelected ? COLORS.forestGreen : COLORS.borderLight;
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected || isLeader}
                              disabled={isLeader}
                              onChange={() => {}}
                              style={{
                                cursor: isLeader ? 'not-allowed' : 'pointer',
                                width: '18px',
                                height: '18px',
                                accentColor: COLORS.forestGreen
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.textPrimary }}>
                                {rangerName}
                                {isLeader && <span style={{ marginLeft: '8px', fontSize: '12px', color: COLORS.success, fontWeight: 700 }}>(Leader)</span>}
                              </div>
                              {ranger.badge_number && (
                                <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '2px' }}>
                                  Badge: {ranger.badge_number}
                                </div>
                              )}
                              {ranger.email && (
                                <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '2px' }}>
                                  {ranger.email}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {newTeam.members.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: COLORS.textSecondary }}>
                      {newTeam.members.length} {newTeam.members.length === 1 ? 'member' : 'members'} selected
                    </div>
                  )}
                </div>

                {/* Objectives */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px', display: 'block' }}>
                    Mission Objectives
                  </label>
                  <textarea
                    value={newTeam.objectives}
                    onChange={(e) => setNewTeam({ ...newTeam, objectives: e.target.value })}
                    placeholder="Enter objectives (one per line)"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
                  />
                </div>

                {/* Equipment */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px', display: 'block' }}>
                    Equipment
                  </label>
                  <textarea
                    value={newTeam.equipment}
                    onChange={(e) => setNewTeam({ ...newTeam, equipment: e.target.value })}
                    placeholder="Enter equipment (one per line)"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ 
              padding: '16px 24px', 
              borderTop: `1px solid ${COLORS.borderLight}`, 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px',
              background: COLORS.secondaryBg
            }}>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '6px',
                  color: COLORS.textSecondary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.borderColor = COLORS.borderMedium; 
                  e.currentTarget.style.background = COLORS.creamBg; 
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.borderColor = COLORS.borderLight; 
                  e.currentTarget.style.background = 'transparent'; 
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!newTeam.name || !newTeam.leader}
                style={{
                  padding: '10px 20px',
                  background: (!newTeam.name || !newTeam.leader) ? COLORS.textSecondary : COLORS.forestGreen,
                  border: 'none',
                  borderRadius: '6px',
                  color: COLORS.white,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: (!newTeam.name || !newTeam.leader) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: (!newTeam.name || !newTeam.leader) ? 0.6 : 1
                }}
                onMouseEnter={(e) => { 
                  if (newTeam.name && newTeam.leader) {
                    e.currentTarget.style.background = COLORS.burntOrange; 
                  }
                }}
                onMouseLeave={(e) => { 
                  if (newTeam.name && newTeam.leader) {
                    e.currentTarget.style.background = COLORS.forestGreen; 
                  }
                }}
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatrolOperations;
