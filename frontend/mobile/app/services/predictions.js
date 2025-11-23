import api from './api';

const predictions = {
  // Get all predictions with optional filters
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

  // Get prediction by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/predictions/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prediction');
    }
  },

  // Create prediction
  create: async (predictionData) => {
    try {
      const response = await api.post('/api/v1/predictions/', predictionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create prediction');
    }
  },

  // Update prediction (full update)
  update: async (id, predictionData) => {
    try {
      const response = await api.put(`/api/v1/predictions/${id}/`, predictionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update prediction');
    }
  },

  // Partial update prediction
  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/predictions/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update prediction');
    }
  },

  // Delete prediction
  delete: async (id) => {
    try {
      await api.delete(`/api/v1/predictions/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete prediction');
    }
  },

  // Generate corridor prediction using RL model
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

  // Get prediction history
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

  // Get corridor predictions only
  getCorridorPredictions: async () => {
    try {
      const response = await api.get('/api/v1/predictions/history/?type=corridor');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch corridor predictions');
    }
  },

  // Get predictions by animal
  getByAnimal: async (animalId) => {
    try {
      const response = await api.get(`/api/v1/predictions/?animal=${animalId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch animal predictions');
    }
  },

  // Get predictions by type
  getByType: async (type) => {
    try {
      const response = await api.get(`/api/v1/predictions/?type=${type}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch predictions by type');
    }
  },

  // Get latest prediction for a specific animal
  getAnimalPrediction: async (animalId) => {
    try {
      const response = await api.get(`/api/v1/predictions/?animal=${animalId}&limit=1`);
      const predictions = response.data.results || response.data || [];
      return predictions.length > 0 ? predictions[0] : null;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch animal prediction');
    }
  },

  // Get XGBoost environment/habitat prediction
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

  // Predict habitat (alternative endpoint)
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

