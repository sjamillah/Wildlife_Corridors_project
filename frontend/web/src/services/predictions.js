import api from './api';

const predictions = {
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/predictions/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch predictions');
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/predictions/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prediction');
    }
  },

  predictCorridor: async ({
    species,
    startLat,
    startLon,
    steps = 50,
    algorithm = 'ppo',
    animalId = null,
  }) => {
    try {
      const response = await api.post('/api/v1/predictions/corridor/', {
        species,
        start_lat: startLat,
        start_lon: startLon,
        steps,
        algorithm,
        animal_id: animalId,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to predict corridor');
    }
  },

  getHistory: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/predictions/history/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prediction history');
    }
  },

  getCorridorPredictions: async () => {
    try {
      const response = await api.get('/api/v1/predictions/history/?type=corridor');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch corridor predictions');
    }
  },

  optimizeCorridor: async ({
    species,
    startPoint,
    endPoint,
    season = 'dry',
    conflictZones = [],
    dynamicUpdate = true,
    saveToDB = false
  }) => {
    try {
      const response = await api.post('/api/v1/corridors/optimize/', {
        species: species.toLowerCase(),
        start_point: {
          lat: startPoint.lat || startPoint[0],
          lon: startPoint.lon || startPoint[1]
        },
        end_point: {
          lat: endPoint.lat || endPoint[0],
          lon: endPoint.lon || endPoint[1]
        },
        season,
        conflict_zones: conflictZones,
        dynamic_update: dynamicUpdate,
        save_to_db: saveToDB
      });
      return response.data;
    } catch (error) {
      console.warn(`Corridor optimization failed for ${species}:`, error.message);
      return null; // Graceful degradation instead of throwing
    }
  },

  getXGBoostEnvironment: async (lat, lon, species = 'elephant', radius = 50000) => {
    try {
      // Try primary endpoint first
      const response = await api.get('/api/v1/ml-predictions/xgboost/environment/', {
        params: { lat, lon, species, radius }
      });
      
      const data = response.data;
      
      // Handle new response format
      if (data.available === false) {
        // ML service unavailable - return fallback
        console.warn('XGBoost ML service unavailable, using fallback:', data.message);
        return {
          available: false,
          habitat_score: data.habitat_score || 0.5,
          suitability: 'unknown',
          status: 'fallback',
          message: data.message || 'ML service unavailable - using fallback values',
          coordinates: data.coordinates || { lat, lon },
          radius_km: radius / 1000,
          species: species
        };
      }
      
      // Success - return formatted data
      return {
        available: true,
        habitat_score: data.habitat_score || 0.5,
        suitability: data.suitability || 'medium',
        status: 'success',
        coordinates: data.coordinates || { lat, lon },
        radius_km: data.radius_km || radius / 1000,
        species: data.species || species,
        features: data.features || {},
        model_info: data.model_info || {}
      };
    } catch (error) {
      // Handle 503 (Service Unavailable) or other errors
      if (error.response?.status === 503) {
        console.warn('XGBoost ML service unavailable (503):', error.message);
        return {
          available: false,
          habitat_score: 0.5,
          suitability: 'unknown',
          status: 'error',
          message: 'ML service unavailable - using fallback values',
          coordinates: { lat, lon },
          radius_km: radius / 1000,
          species: species
        };
      }
      
      // Try alternative endpoint
      try {
        const altResponse = await api.get('/api/v1/predictions/xgboost/environment/', {
          params: { lat, lon, species, radius }
        });
        const altData = altResponse.data;
        
        if (altData.available === false) {
          return {
            available: false,
            habitat_score: altData.habitat_score || 0.5,
            suitability: 'unknown',
            status: 'fallback',
            message: altData.message || 'ML service unavailable',
            coordinates: altData.coordinates || { lat, lon },
            radius_km: radius / 1000,
            species: species
          };
        }
        
        return {
          available: true,
          habitat_score: altData.habitat_score || 0.5,
          suitability: altData.suitability || 'medium',
          status: 'success',
          coordinates: altData.coordinates || { lat, lon },
          radius_km: altData.radius_km || radius / 1000,
          species: altData.species || species,
          features: altData.features || {},
          model_info: altData.model_info || {}
        };
      } catch (altError) {
      console.warn('XGBoost environment endpoint unavailable:', error.message);
        // Return fallback on all errors
        return {
          available: false,
          habitat_score: 0.5,
          suitability: 'unknown',
          status: 'error',
          message: 'Failed to fetch habitat prediction',
          coordinates: { lat, lon },
          radius_km: radius / 1000,
          species: species
        };
      }
    }
  },

  predictHabitat: async (lat, lon, species = 'elephant') => {
    try {
      const response = await api.post('/api/v1/ml-predictions/xgboost/predict/', {
        lat,
        lon,
        species
      });
      return response.data;
    } catch (error) {
      console.warn('Habitat prediction endpoint unavailable:', error.message);
      return null;
    }
  },
};

export default predictions;


