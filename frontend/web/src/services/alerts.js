import api from './api';

const alerts = {
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/conflict-zones/alerts/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alerts');
    }
  },

  getActive: async () => {
    try {
      const response = await api.get('/api/v1/conflict-zones/alerts/?status=pending');
      return response.data.results || response.data;
    } catch (error) {
      console.warn('Active alerts endpoint unavailable:', error.message);
      return [];
    }
  },

  getCritical: async () => {
    try {
      const response = await api.get('/api/v1/conflict-zones/alerts/?severity=critical&status=pending');
      return response.data.results || response.data;
    } catch (error) {
      console.warn('Critical alerts endpoint unavailable:', error.message);
      return [];
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
      throw new Error(error.response?.data?.message || 'Failed to acknowledge alert');
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
      throw new Error(error.response?.data?.message || 'Failed to resolve alert');
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/api/v1/conflict-zones/alerts/statistics/');
      return {
        total: response.data.total_alerts || 0,
        active: response.data.by_status?.pending || 0,
        critical: response.data.by_severity?.critical || 0,
        by_type: response.data.by_type || {},
        by_severity: response.data.by_severity || {},
        by_status: response.data.by_status || {},
        recent_critical: response.data.recent_critical || 0,
        pending_high_priority: response.data.pending_high_priority || 0
      };
    } catch (error) {
      console.warn('Alert statistics endpoint unavailable:', error.message);
      return {
        total: 0,
        active: 0,
        critical: 0,
        by_type: {},
        by_severity: {},
        by_status: {},
        recent_critical: 0,
        pending_high_priority: 0
      };
    }
  },
};

export default alerts;

