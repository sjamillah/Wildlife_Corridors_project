import api from './api';

const conflictZones = {
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/conflict-zones/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conflict zones');
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/conflict-zones/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conflict zone');
    }
  },

  create: async (zoneData) => {
    try {
      const response = await api.post('/api/v1/conflict-zones/', zoneData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create conflict zone');
    }
  },

  update: async (id, zoneData) => {
    try {
      const response = await api.put(`/api/v1/conflict-zones/${id}/`, zoneData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update conflict zone');
    }
  },

  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/conflict-zones/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update conflict zone');
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/api/v1/conflict-zones/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete conflict zone');
    }
  },

  getActive: async () => {
    try {
      const response = await api.get('/api/v1/conflict-zones/?is_active=true');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active conflict zones');
    }
  },

  getByType: async (zoneType) => {
    try {
      const response = await api.get(`/api/v1/conflict-zones/?zone_type=${zoneType}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conflict zones by type');
    }
  },

  getHighSeverity: async () => {
    try {
      const response = await api.get('/api/v1/conflict-zones/?severity=high&is_active=true');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch high severity zones');
    }
  },
};

export default conflictZones;

