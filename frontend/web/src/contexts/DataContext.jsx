import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { animals as animalsService, corridors as corridorsService, alerts as alertsService, rangers as rangersService } from '@/services';
import api from '@/services/api';

const DataContext = createContext(null);

// Cache TTL: 30 seconds for real-time data, 5 minutes for static data
const CACHE_TTL = {
  animals: 30000,      // 30 seconds
  corridors: 300000,    // 5 minutes
  riskZones: 300000,   // 5 minutes
  alerts: 30000,       // 30 seconds
  rangers: 30000,      // 30 seconds
};

// In-memory cache (for web app)
const memoryCache = {
  animals: null,
  corridors: null,
  riskZones: null,
  alerts: null,
  rangers: null,
  timestamps: {
    animals: 0,
    corridors: 0,
    riskZones: 0,
    alerts: 0,
    rangers: 0,
  },
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [animals, setAnimals] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [rangers, setRangers] = useState([]);
  
  const [loading, setLoading] = useState({
    animals: false,
    corridors: false,
    riskZones: false,
    alerts: false,
    rangers: false,
  });
  
  const [lastFetch, setLastFetch] = useState({
    animals: 0,
    corridors: 0,
    riskZones: 0,
    alerts: 0,
    rangers: 0,
  });
  
  const fetchInProgress = useRef({
    animals: false,
    corridors: false,
    riskZones: false,
    alerts: false,
    rangers: false,
  });

  // Load from cache helper
  const loadFromCache = (key) => {
    const cached = memoryCache[key];
    const timestamp = memoryCache.timestamps[key];
    
    if (cached && timestamp) {
      const age = Date.now() - timestamp;
      const ttl = CACHE_TTL[key] || 30000;
      
      if (age < ttl) {
        console.log(`✅ Loaded ${key} from cache (age: ${Math.round(age / 1000)}s)`);
        return cached;
      } else {
        console.log(`⏰ Cache expired for ${key} (age: ${Math.round(age / 1000)}s, TTL: ${ttl / 1000}s)`);
      }
    }
    return null;
  };

  // Save to cache helper
  const saveToCache = (key, data) => {
    memoryCache[key] = data;
    memoryCache.timestamps[key] = Date.now();
  };

  // Fetch animals (with caching and deduplication)
  const fetchAnimals = useCallback(async (force = false) => {
    const key = 'animals';
    
    // Prevent duplicate requests
    if (fetchInProgress.current[key] && !force) {
      return; // Silently skip
    }
    
    // Check cache first (unless forced)
    if (!force) {
      const cached = loadFromCache(key);
      if (cached) {
        setAnimals(cached);
        setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${key} from cache`);
        }
        return;
      }
      
      // Check if last fetch was recent enough
      const timeSinceLastFetch = Date.now() - lastFetch[key];
      if (timeSinceLastFetch < CACHE_TTL[key]) {
        return; // Silently skip
      }
    }
    
    fetchInProgress.current[key] = true;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`📤 Fetching ${key}...`);
      const data = await animalsService.getLiveStatus();
      const animalsData = data.results || data || [];
      
      setAnimals(animalsData);
      setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
      saveToCache(key, animalsData);
      console.log(`✅ ${key}: ${animalsData.length} items`);
    } catch (error) {
      console.error(`❌ Failed to fetch ${key}:`, error);
      const cached = loadFromCache(key);
      if (cached) {
        setAnimals(cached);
      }
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
      fetchInProgress.current[key] = false;
    }
  }, [lastFetch]);

  // Fetch corridors (with caching and deduplication)
  const fetchCorridors = useCallback(async (force = false) => {
    const key = 'corridors';
    
    if (fetchInProgress.current[key] && !force) {
      return; // Silently skip
    }
    
    if (!force) {
      const cached = loadFromCache(key);
      if (cached) {
        setCorridors(cached);
        setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${key} from cache`);
        }
        return;
      }
      
      const timeSinceLastFetch = Date.now() - lastFetch[key];
      if (timeSinceLastFetch < CACHE_TTL[key]) {
        return; // Silently skip
      }
    }
    
    fetchInProgress.current[key] = true;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`📤 Fetching ${key}...`);
      const data = await corridorsService.getAll();
      const corridorsData = data.results || data || [];
      
      setCorridors(corridorsData);
      setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
      saveToCache(key, corridorsData);
      console.log(`✅ ${key}: ${corridorsData.length} items`);
    } catch (error) {
      console.error(`❌ Failed to fetch ${key}:`, error);
      const cached = loadFromCache(key);
      if (cached) {
        setCorridors(cached);
      }
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
      fetchInProgress.current[key] = false;
    }
  }, [lastFetch]);

  // Fetch risk zones (with caching and deduplication)
  const fetchRiskZones = useCallback(async (force = false) => {
    const key = 'riskZones';
    
    if (fetchInProgress.current[key] && !force) {
      return; // Silently skip
    }
    
    if (!force) {
      const cached = loadFromCache(key);
      if (cached) {
        setRiskZones(cached);
        setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${key} from cache`);
        }
        return;
      }
      
      const timeSinceLastFetch = Date.now() - lastFetch[key];
      if (timeSinceLastFetch < CACHE_TTL[key]) {
        return; // Silently skip
      }
    }
    
    fetchInProgress.current[key] = true;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`📤 Fetching ${key}...`);
      const response = await api.get('/api/v1/conflict-zones/?is_active=true');
      const zones = response.data.results || response.data || [];
      
      const transformedZones = zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        type: zone.zone_type,
        riskLevel: zone.risk_level,
        coordinates: zone.geometry?.coordinates || [],
        bufferDistance: zone.buffer_distance_km || 5,
        ...zone
      }));
      
      setRiskZones(transformedZones);
      setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
      saveToCache(key, transformedZones);
      console.log(`✅ ${key}: ${transformedZones.length} items`);
    } catch (error) {
      console.error(`❌ Failed to fetch ${key}:`, error);
      const cached = loadFromCache(key);
      if (cached) {
        setRiskZones(cached);
      }
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
      fetchInProgress.current[key] = false;
    }
  }, [lastFetch]);

  // Fetch alerts (with caching and deduplication)
  const fetchAlerts = useCallback(async (force = false) => {
    const key = 'alerts';
    
    if (fetchInProgress.current[key] && !force) {
      return; // Silently skip
    }
    
    if (!force) {
      const cached = loadFromCache(key);
      if (cached) {
        setAlerts(cached);
        setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${key} from cache`);
        }
        return;
      }
      
      const timeSinceLastFetch = Date.now() - lastFetch[key];
      if (timeSinceLastFetch < CACHE_TTL[key]) {
        return; // Silently skip
      }
    }
    
    fetchInProgress.current[key] = true;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`📤 Fetching ${key}...`);
      const data = await alertsService.getAll();
      const alertsArray = Array.isArray(data) ? data : (data.results || []);
      // Ensure max 30 alerts (service should already limit, but double-check)
      const limitedAlerts = alertsArray.slice(0, 30);
      
      setAlerts(limitedAlerts);
      setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
      saveToCache(key, limitedAlerts);
      console.log(`✅ ${key}: ${limitedAlerts.length} items (limited to 30)`);
    } catch (error) {
      console.error(`❌ Failed to fetch ${key}:`, error);
      const cached = loadFromCache(key);
      if (cached) {
        setAlerts(cached);
      }
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
      fetchInProgress.current[key] = false;
    }
  }, [lastFetch]);

  // Fetch rangers (with caching and deduplication)
  const fetchRangers = useCallback(async (force = false) => {
    const key = 'rangers';
    
    if (fetchInProgress.current[key] && !force) {
      return; // Silently skip
    }
    
    if (!force) {
      const cached = loadFromCache(key);
      if (cached) {
        setRangers(cached);
        setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ ${key} from cache`);
        }
        return;
      }
      
      const timeSinceLastFetch = Date.now() - lastFetch[key];
      if (timeSinceLastFetch < CACHE_TTL[key]) {
        return; // Silently skip
      }
    }
    
    fetchInProgress.current[key] = true;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      console.log(`📤 Fetching ${key}...`);
      const data = await rangersService.getLiveStatus();
      const transformedRangers = (data || []).map(ranger => ({
        id: ranger.ranger_id,
        name: ranger.name,
        badgeNumber: ranger.badge_number,
        team: ranger.team_name,
        status: ranger.current_status,
        coordinates: [
          ranger.current_position?.lat || 0,
          ranger.current_position?.lon || 0
        ],
        activity: ranger.activity_type || 'patrolling',
        battery: ranger.battery_level || '100%',
        lastSeen: ranger.current_position?.timestamp || ranger.last_active,
        ...ranger
      }));
      
      setRangers(transformedRangers);
      setLastFetch(prev => ({ ...prev, [key]: Date.now() }));
      saveToCache(key, transformedRangers);
      console.log(`✅ ${key}: ${transformedRangers.length} items`);
    } catch (error) {
      console.error(`❌ Failed to fetch ${key}:`, error);
      const cached = loadFromCache(key);
      if (cached) {
        setRangers(cached);
      }
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
      fetchInProgress.current[key] = false;
    }
  }, [lastFetch]);

  // Initial load - fetch all data in parallel (only once)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 DataProvider: Initializing...');
    }
    Promise.allSettled([
      fetchAnimals(),
      fetchCorridors(),
      fetchRiskZones(),
      fetchAlerts(),
      fetchRangers(),
    ]).then(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ DataProvider: Ready');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - fetch functions are stable useCallbacks

  // Auto-refresh based on TTL
  useEffect(() => {
    const intervals = {
      animals: setInterval(() => {
        const timeSinceLastFetch = Date.now() - lastFetch.animals;
        if (timeSinceLastFetch >= CACHE_TTL.animals) {
          fetchAnimals();
        }
      }, CACHE_TTL.animals),
      
      alerts: setInterval(() => {
        const timeSinceLastFetch = Date.now() - lastFetch.alerts;
        if (timeSinceLastFetch >= CACHE_TTL.alerts) {
          fetchAlerts();
        }
      }, CACHE_TTL.alerts),
      
      rangers: setInterval(() => {
        const timeSinceLastFetch = Date.now() - lastFetch.rangers;
        if (timeSinceLastFetch >= CACHE_TTL.rangers) {
          fetchRangers();
        }
      }, CACHE_TTL.rangers),
    };

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [lastFetch, fetchAnimals, fetchAlerts, fetchRangers]);

  const value = {
    // Data
    animals,
    corridors,
    riskZones,
    alerts,
    rangers,
    
    // Loading states
    loading,
    
    // Fetch functions (with force option)
    fetchAnimals: () => fetchAnimals(true),
    fetchCorridors: () => fetchCorridors(true),
    fetchRiskZones: () => fetchRiskZones(true),
    fetchAlerts: () => fetchAlerts(true),
    fetchRangers: () => fetchRangers(true),
    
    // Refresh all
    refreshAll: () => {
      Promise.allSettled([
        fetchAnimals(true),
        fetchCorridors(true),
        fetchRiskZones(true),
        fetchAlerts(true),
        fetchRangers(true),
      ]);
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

