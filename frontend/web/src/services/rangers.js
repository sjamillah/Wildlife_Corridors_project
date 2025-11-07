import api from './api';

const rangers = {
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/rangers/rangers/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch rangers');
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/rangers/rangers/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ranger details');
    }
  },

  getLiveStatus: async () => {
    try {
      const response = await api.get('/api/v1/rangers/rangers/live_status/');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('Rangers endpoint not available - module not yet implemented');
        return [];
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch ranger live status');
    }
  },

  create: async (rangerData) => {
    try {
      const response = await api.post('/api/v1/rangers/rangers/', rangerData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create ranger');
    }
  },

  update: async (id, rangerData) => {
    try {
      const response = await api.put(`/api/v1/rangers/rangers/${id}/`, rangerData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update ranger');
    }
  },

  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/rangers/rangers/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update ranger');
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/api/v1/rangers/rangers/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete ranger');
    }
  },

  getMovementTrail: async (rangerId, options = {}) => {
    try {
      const { points = 100, days, hours, all = true } = options;
      const params = new URLSearchParams();
      if (points) params.append('points', points);
      if (days) params.append('days', days);
      if (hours) params.append('hours', hours);
      if (all) params.append('all', all);
      
      const url = `/api/v1/rangers/rangers/${rangerId}/movement_trail/?${params.toString()}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ranger movement trail');
    }
  },

  logs: {
    getAll: async (filters = {}) => {
      try {
        const params = new URLSearchParams(filters).toString();
        const url = `/api/v1/rangers/logs/${params ? `?${params}` : ''}`;
        const response = await api.get(url);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch logs');
      }
    },

    getById: async (id) => {
      try {
        const response = await api.get(`/api/v1/rangers/logs/${id}/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch log');
      }
    },

    create: async (logData) => {
      try {
        const response = await api.post('/api/v1/rangers/logs/', logData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create log');
      }
    },

    getEmergencies: async () => {
      try {
        const response = await api.get('/api/v1/rangers/logs/emergencies/');
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch emergencies');
      }
    },

    resolve: async (logId) => {
      try {
        const response = await api.post(`/api/v1/rangers/logs/${logId}/resolve/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to resolve emergency');
      }
    },
  },

  routes: {
    getAll: async (filters = {}) => {
      try {
        const params = new URLSearchParams(filters).toString();
        const url = `/api/v1/rangers/routes/${params ? `?${params}` : ''}`;
        const response = await api.get(url);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch routes');
      }
    },

    getById: async (id) => {
      try {
        const response = await api.get(`/api/v1/rangers/routes/${id}/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch route');
      }
    },

    create: async (routeData) => {
      try {
        const response = await api.post('/api/v1/rangers/routes/', routeData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create route');
      }
    },

    startPatrol: async (routeId) => {
      try {
        const response = await api.post(`/api/v1/rangers/routes/${routeId}/start_patrol/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to start patrol');
      }
    },

    endPatrol: async (routeId) => {
      try {
        const response = await api.post(`/api/v1/rangers/routes/${routeId}/end_patrol/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to end patrol');
      }
    },
  },

  tracking: {
    create: async (trackingData) => {
      try {
        const response = await api.post('/api/v1/rangers/tracking/', trackingData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to submit tracking data');
      }
    },

    getByRanger: async (rangerId, filters = {}) => {
      try {
        const params = new URLSearchParams({ ...filters, ranger: rangerId }).toString();
        const url = `/api/v1/rangers/tracking/?${params}`;
        const response = await api.get(url);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch ranger tracking');
      }
    },
  },

  sync: {
    upload: async (syncData) => {
      try {
        const response = await api.post('/api/v1/sync/upload/', syncData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to sync data');
      }
    },

    getStatus: async (deviceId) => {
      try {
        const response = await api.get(`/api/v1/sync/status/?device_id=${deviceId}`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to get sync status');
      }
    },
  },
};

export default rangers;

