import api from './api';

const alerts = {
  // Get all alerts from /api/v1/alerts/active/ (or fallback to /api/v1/alerts/)
  getAll: async (filters = {}) => {
    try {
      // Try active alerts endpoint first
      const response = await api.get('/api/v1/alerts/active/');
      const data = response.data;
      console.log('Mobile: Received alerts data:', data);
      // Handle both array and paginated responses
      if (Array.isArray(data)) {
        return data;
      }
      const results = data.results || data || [];
      console.log('Mobile: Returning', results.length, 'alerts');
      return results;
    } catch (error) {
      console.warn('Mobile: Active alerts endpoint not available, trying alternative:', error.message);
      // Fallback to regular alerts endpoint
      try {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== null) {
            params.append(key, filters[key]);
          }
        });
        const queryString = params.toString();
        const url = `/api/v1/alerts/${queryString ? `?${queryString}` : ''}`;
        console.log('Mobile: Fetching alerts from:', url);
        const fallbackResponse = await api.get(url);
        const fallbackData = fallbackResponse.data;
        if (Array.isArray(fallbackData)) {
          return fallbackData;
        }
        return fallbackData.results || fallbackData || [];
      } catch (fallbackError) {
        console.error('Mobile: Alerts endpoint error:', fallbackError);
        console.error('Mobile: Error details:', fallbackError.response?.data || fallbackError.message);
        return [];
      }
    }
  },

  // Create a new alert
  create: async (alertData) => {
    try {
      // Try the alerts endpoint first
      const response = await api.post('/api/v1/alerts/alerts/', alertData);
      return response.data;
    } catch (error) {
      // Fallback to alternative endpoint
      try {
        const fallbackResponse = await api.post('/api/v1/alerts/', alertData);
        return fallbackResponse.data;
      } catch (fallbackError) {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.detail ||
                           fallbackError.response?.data?.message ||
                           fallbackError.message ||
                           'Failed to create alert';
        console.error('Alert creation error:', errorMessage, error.response?.data);
        throw new Error(errorMessage);
      }
    }
  },

  // Create dummy alert for testing
  createDummyAlert: async (alertData) => {
    const dummyAlert = {
      type: alertData.type || 'Wildlife Alert',
      title: alertData.title || 'Test Alert',
      message: alertData.message || 'This is a test alert from mobile app',
      severity: alertData.severity || alertData.priority || 'medium',
      priority: alertData.priority || alertData.severity || 'medium',
      location: alertData.location || 'Unknown',
      coordinates: alertData.coordinates || null,
      animal_id: alertData.animalId || null,
      animal_name: alertData.animalName || null,
      status: 'active',
      source: 'mobile_app',
      timestamp: new Date().toISOString(),
      ...alertData
    };

    return await alerts.create(dummyAlert);
  },

  // Get alert by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/alerts/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alert');
    }
  },

  // Update alert (full update)
  update: async (id, alertData) => {
    try {
      const response = await api.put(`/api/v1/alerts/${id}/`, alertData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update alert');
    }
  },

  // Partial update alert
  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/alerts/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update alert');
    }
  },

  // Delete alert
  delete: async (id) => {
    try {
      await api.delete(`/api/v1/alerts/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete alert');
    }
  },

  // Get active alerts
  getActive: async () => {
    try {
      const response = await api.get('/api/v1/alerts/active/');
      return response.data.results || response.data || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active alerts');
    }
  },

  // Get critical alerts
  getCritical: async () => {
    try {
      const response = await api.get('/api/v1/alerts/critical/');
      return response.data.results || response.data || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch critical alerts');
    }
  },

  // Get alert statistics
  getStats: async () => {
    try {
      const response = await api.get('/api/v1/alerts/stats/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alert stats');
    }
  },

  // Acknowledge alert
  acknowledge: async (alertId, notes = '') => {
    try {
      const response = await api.post(`/api/v1/alerts/${alertId}/acknowledge/`, { notes });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to acknowledge alert');
    }
  },

  // Resolve alert
  resolve: async (alertId, resolutionNotes = '') => {
    try {
      const response = await api.post(`/api/v1/alerts/${alertId}/resolve/`, { resolution_notes: resolutionNotes });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to resolve alert');
    }
  },
};

export default alerts;

