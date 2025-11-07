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

  // Update prediction
  update: async (id, predictionData) => {
    try {
      const response = await api.put(`/api/v1/predictions/${id}/`, predictionData);
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
};

export default predictions;

