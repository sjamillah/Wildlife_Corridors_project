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

  getGeoJSON: async () => {
    try {
      const response = await api.get('/api/v1/conflict-zones/geojson/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conflict zones GeoJSON');
    }
  },

  alerts: {
    getAll: async (filters = {}) => {
      try {
        const params = new URLSearchParams(filters).toString();
        const url = `/api/v1/conflict-zones/alerts/${params ? `?${params}` : ''}`;
        const response = await api.get(url);
        return response.data.results || response.data || [];
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch conflict zone alerts');
      }
    },

    getById: async (id) => {
      try {
        const response = await api.get(`/api/v1/conflict-zones/alerts/${id}/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch conflict zone alert');
      }
    },

    create: async (alertData) => {
      try {
        const response = await api.post('/api/v1/conflict-zones/alerts/', alertData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create conflict zone alert');
      }
    },

    update: async (id, alertData) => {
      try {
        const response = await api.put(`/api/v1/conflict-zones/alerts/${id}/`, alertData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update conflict zone alert');
      }
    },

    patch: async (id, partialData) => {
      try {
        const response = await api.patch(`/api/v1/conflict-zones/alerts/${id}/`, partialData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update conflict zone alert');
      }
    },

    delete: async (id) => {
      try {
        await api.delete(`/api/v1/conflict-zones/alerts/${id}/`);
        return { success: true };
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete conflict zone alert');
      }
    },

    getActive: async () => {
      try {
        const response = await api.get('/api/v1/conflict-zones/alerts/active/');
        return response.data.results || response.data || [];
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch active conflict zone alerts');
      }
    },

    getCritical: async () => {
      try {
        const response = await api.get('/api/v1/conflict-zones/alerts/critical/');
        return response.data.results || response.data || [];
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch critical conflict zone alerts');
      }
    },

    getStats: async () => {
      try {
        const response = await api.get('/api/v1/conflict-zones/alerts/stats/');
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch conflict zone alert stats');
      }
    },

    acknowledge: async (alertId, notes = '') => {
      try {
        const response = await api.post(
          `/api/v1/conflict-zones/alerts/${alertId}/acknowledge/`,
          { notes }
        );
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to acknowledge conflict zone alert');
      }
    },

    resolve: async (alertId, resolutionNotes = '') => {
      try {
        const response = await api.post(
          `/api/v1/conflict-zones/alerts/${alertId}/resolve/`,
          { resolution_notes: resolutionNotes }
        );
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to resolve conflict zone alert');
      }
    },
  },
};

export default conflictZones;

