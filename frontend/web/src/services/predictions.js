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
      const response = await api.get('/api/v1/ml-predictions/xgboost/environment/', {
        params: { lat, lon, species, radius }
      });
      return response.data;
    } catch (error) {
      console.warn('XGBoost environment endpoint unavailable:', error.message);
      return null;
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


