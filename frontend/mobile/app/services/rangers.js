import api from './api';

const rangers = {
  // Get all rangers with optional filters
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

  // Get ranger by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/rangers/rangers/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ranger details');
    }
  },

  // Get live status of all rangers on duty
  getLiveStatus: async () => {
    try {
      const response = await api.get('/api/v1/rangers/rangers/live_status/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch ranger live status');
    }
  },

  // Update ranger (full update)
  update: async (id, rangerData) => {
    try {
      const response = await api.put(`/api/v1/rangers/rangers/${id}/`, rangerData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update ranger');
    }
  },

  // Partial update ranger (e.g., status change)
  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/rangers/rangers/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update ranger');
    }
  },

  // Get ranger movement trail
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

  // Patrol Logs
  logs: {
    // Get all logs with filters
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

    // Get log by ID
    getById: async (id) => {
      try {
        const response = await api.get(`/api/v1/rangers/logs/${id}/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch log');
      }
    },

    // Create new log (sighting, emergency, checkpoint, etc.)
    create: async (logData) => {
      try {
        const response = await api.post('/api/v1/rangers/logs/', logData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create log');
      }
    },

    // Get active emergencies only
    getEmergencies: async () => {
      try {
        const response = await api.get('/api/v1/rangers/logs/emergencies/');
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch emergencies');
      }
    },

    // Update log (full update)
    update: async (id, logData) => {
      try {
        const response = await api.put(`/api/v1/rangers/logs/${id}/`, logData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update log');
      }
    },

    // Partial update log
    patch: async (id, partialData) => {
      try {
        const response = await api.patch(`/api/v1/rangers/logs/${id}/`, partialData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update log');
      }
    },

    // Delete log
    delete: async (id) => {
      try {
        await api.delete(`/api/v1/rangers/logs/${id}/`);
        return { success: true };
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete log');
      }
    },

    // Resolve emergency
    resolve: async (logId) => {
      try {
        const response = await api.post(`/api/v1/rangers/logs/${logId}/resolve/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to resolve emergency');
      }
    },
  },

  // Patrol Routes
  routes: {
    // Get all routes
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

    // Get route by ID
    getById: async (id) => {
      try {
        const response = await api.get(`/api/v1/rangers/routes/${id}/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch route');
      }
    },

    // Create new route
    create: async (routeData) => {
      try {
        const response = await api.post('/api/v1/rangers/routes/', routeData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create route');
      }
    },

    // Start patrol
    startPatrol: async (routeId) => {
      try {
        const response = await api.post(`/api/v1/rangers/routes/${routeId}/start_patrol/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to start patrol');
      }
    },

    // Update route (full update)
    update: async (id, routeData) => {
      try {
        const response = await api.put(`/api/v1/rangers/routes/${id}/`, routeData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update route');
      }
    },

    // Partial update route
    patch: async (id, partialData) => {
      try {
        const response = await api.patch(`/api/v1/rangers/routes/${id}/`, partialData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update route');
      }
    },

    // Delete route
    delete: async (id) => {
      try {
        await api.delete(`/api/v1/rangers/routes/${id}/`);
        return { success: true };
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete route');
      }
    },

    // End patrol
    endPatrol: async (routeId) => {
      try {
        const response = await api.post(`/api/v1/rangers/routes/${routeId}/end_patrol/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to end patrol');
      }
    },
  },

  // Ranger Tracking (GPS points)
  tracking: {
    // Get all tracking data
    getAll: async (filters = {}) => {
      try {
        const params = new URLSearchParams(filters).toString();
        const url = `/api/v1/rangers/tracking/${params ? `?${params}` : ''}`;
        const response = await api.get(url);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch tracking data');
      }
    },

    // Get tracking point by ID
    getById: async (id) => {
      try {
        const response = await api.get(`/api/v1/rangers/tracking/${id}/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch tracking point');
      }
    },

    // Submit GPS tracking point
    create: async (trackingData) => {
      try {
        const response = await api.post('/api/v1/rangers/tracking/', trackingData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to submit tracking data');
      }
    },

    // Update tracking point
    update: async (id, trackingData) => {
      try {
        const response = await api.put(`/api/v1/rangers/tracking/${id}/`, trackingData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update tracking data');
      }
    },

    // Partial update tracking point
    patch: async (id, partialData) => {
      try {
        const response = await api.patch(`/api/v1/rangers/tracking/${id}/`, partialData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update tracking data');
      }
    },

    // Delete tracking point
    delete: async (id) => {
      try {
        await api.delete(`/api/v1/rangers/tracking/${id}/`);
        return { success: true };
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete tracking data');
      }
    },

    // Get tracking history for a ranger
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

  // Offline Sync
  sync: {
    // Bulk upload offline data
    upload: async (syncData) => {
      try {
        const response = await api.post('/api/v1/sync/upload/', syncData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to sync data');
      }
    },

    // Get sync status
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

