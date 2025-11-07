import api from './api';

const tracking = {
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

  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/tracking/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tracking point');
    }
  },

  create: async (trackingData) => {
    try {
      const response = await api.post('/api/v1/tracking/', trackingData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload tracking data');
    }
  },

  update: async (id, trackingData) => {
    try {
      const response = await api.put(`/api/v1/tracking/${id}/`, trackingData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update tracking data');
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/api/v1/tracking/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete tracking data');
    }
  },

  getLive: async () => {
    try {
      const response = await api.get('/api/v1/tracking/live/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch live tracking');
    }
  },

  getLiveTracking: async () => {
    try {
      const response = await api.get('/api/v1/tracking/live_tracking/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch live tracking pipeline');
    }
  },

  getByAnimal: async (animalId, filters = {}) => {
    try {
      const params = new URLSearchParams({ ...filters, animal: animalId }).toString();
      const response = await api.get(`/api/v1/tracking/?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch animal tracking data');
    }
  },
};

const observations = {
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

  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/tracking/observations/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch observation');
    }
  },

  create: async (observationData) => {
    try {
      const response = await api.post('/api/v1/tracking/observations/', observationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create observation');
    }
  },

  update: async (id, observationData) => {
    try {
      const response = await api.put(`/api/v1/tracking/observations/${id}/`, observationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update observation');
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/api/v1/tracking/observations/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete observation');
    }
  },
};

export default tracking;
export { observations };


