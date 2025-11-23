import api from './api';

const tracking = {
  // Get all tracking data with optional filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/tracking/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tracking data');
    }
  },

  // Get tracking point by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/tracking/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tracking point');
    }
  },

  // Upload GPS data
  create: async (trackingData) => {
    try {
      const response = await api.post('/api/v1/tracking/', trackingData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload tracking data');
    }
  },

  // Bulk upload GPS data
  createBulk: async (trackingDataArray) => {
    try {
      const promises = trackingDataArray.map(data => api.post('/api/v1/tracking/', data));
      const responses = await Promise.all(promises);
      return responses.map(r => r.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to bulk upload tracking data');
    }
  },

  // Update tracking point
  update: async (id, trackingData) => {
    try {
      const response = await api.put(`/api/v1/tracking/${id}/`, trackingData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update tracking data');
    }
  },

  // Partial update tracking point
  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/tracking/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update tracking data');
    }
  },

  // Delete tracking point
  delete: async (id) => {
    try {
      await api.delete(`/api/v1/tracking/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete tracking data');
    }
  },

  // Get live tracking data (real-time stream)
  getLive: async () => {
    try {
      const response = await api.get('/api/v1/tracking/live/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch live tracking');
    }
  },

  // Get live tracking (alternative endpoint)
  getLiveTracking: async () => {
    try {
      const response = await api.get('/api/v1/tracking/live_tracking/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch live tracking');
    }
  },

  // Get tracking data for specific animal
  getByAnimal: async (animalId, filters = {}) => {
    try {
      const params = new URLSearchParams({ ...filters, animal: animalId }).toString();
      const response = await api.get(`/api/v1/tracking/?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch animal tracking data');
    }
  },

  // Get tracking data by date range
  getByDateRange: async (startDate, endDate, filters = {}) => {
    try {
      const params = new URLSearchParams({
        ...filters,
        timestamp__gte: startDate,
        timestamp__lte: endDate,
      }).toString();
      const response = await api.get(`/api/v1/tracking/?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tracking data by date range');
    }
  },

  // Analyze behavior for an animal
  analyzeBehavior: async (animalId, filters = {}) => {
    try {
      const params = new URLSearchParams({ ...filters, animal: animalId }).toString();
      const response = await api.get(`/api/v1/tracking/behavior/analyze/?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to analyze behavior');
    }
  },

  // Get behavior summary for all animals
  getBehaviorSummary: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/api/v1/tracking/behavior/summary/${params ? `?${params}` : ''}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch behavior summary');
    }
  },
};

// Observations
const observations = {
  // Get all observations with optional filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/tracking/observations/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch observations');
    }
  },

  // Get observation by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/tracking/observations/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch observation');
    }
  },

  // Create observation
  create: async (observationData) => {
    try {
      const response = await api.post('/api/v1/tracking/observations/', observationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create observation');
    }
  },

  // Update observation (full update)
  update: async (id, observationData) => {
    try {
      const response = await api.put(`/api/v1/tracking/observations/${id}/`, observationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update observation');
    }
  },

  // Partial update observation
  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/tracking/observations/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update observation');
    }
  },

  // Delete observation
  delete: async (id) => {
    try {
      await api.delete(`/api/v1/tracking/observations/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete observation');
    }
  },

  // Get observations by animal
  getByAnimal: async (animalId) => {
    try {
      const response = await api.get(`/api/v1/tracking/observations/?animal=${animalId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch animal observations');
    }
  },
};

export default tracking;
export { observations };

