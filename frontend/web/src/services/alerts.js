import api from './api';

/**
 * Alerts Service
 * 
 * Alerts are automatically created by the backend when:
 * - New tracking data is received via POST /api/v1/tracking/
 * - Animals enter or approach conflict zones
 * - Animals exit corridors
 * - Unusual movement patterns are detected
 * - Collar issues are detected (battery/signal)
 * 
 * Severity is determined by:
 * - Conflict zone's risk_level field ('high', 'medium', 'low')
 * - Whether the animal is inside or approaching the zone
 * - Zone type (settlement, road, agriculture, etc.)
 * Alerts are generated from real tracking data only, with severity based on conflict zone risk levels.
 * No simulation.
 */
const alerts = {
  /**
   * Get all alerts with optional filters
   * @param {Object} filters - Filter options (status, severity, etc.)
   * @returns {Promise<Array>} Array of alerts
   * 
   * Example: getAll({ severity: 'critical' }) to filter by severity
   */
  getAll: async (filters = {}) => {
    try {
      // Use the active alerts endpoint to get all active alerts
      const response = await api.get('/api/v1/alerts/active/');
      // Handle both array response and paginated response
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      // Fallback for paginated responses
      return data.results || data || [];
    } catch (error) {
      console.warn('Active alerts endpoint not available, trying alternative:', error.message);
      // Fallback to regular alerts endpoint if active endpoint fails
      try {
        const params = new URLSearchParams(filters).toString();
        const url = `/api/v1/alerts/${params ? `?${params}` : ''}`;
        const fallbackResponse = await api.get(url);
        const fallbackData = fallbackResponse.data;
        return Array.isArray(fallbackData) ? fallbackData : (fallbackData.results || fallbackData || []);
      } catch (fallbackError) {
        console.warn('Alerts endpoint not available:', fallbackError.message);
        return [];
      }
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/alerts/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alert');
    }
  },

  create: async (alertData) => {
    try {
      const response = await api.post('/api/v1/alerts/', alertData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create alert');
    }
  },

  update: async (id, alertData) => {
    try {
      const response = await api.put(`/api/v1/alerts/${id}/`, alertData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update alert');
    }
  },

  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/alerts/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update alert');
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/api/v1/alerts/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete alert');
    }
  },

  getActive: async () => {
    try {
      const response = await api.get('/api/v1/alerts/active/');
      return response.data.results || response.data || [];
    } catch (error) {
      console.warn('Active alerts endpoint unavailable:', error.message);
      return [];
    }
  },

  getCritical: async () => {
    try {
      const response = await api.get('/api/v1/alerts/critical/');
      return response.data.results || response.data || [];
    } catch (error) {
      console.warn('Critical alerts endpoint unavailable:', error.message);
      return [];
    }
  },

  acknowledge: async (alertId, notes = '') => {
    try {
      const response = await api.post(
        `/api/v1/alerts/alerts/${alertId}/acknowledge/`,
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
        `/api/v1/alerts/alerts/${alertId}/resolve/`,
        { resolution_notes: resolutionNotes }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to resolve alert');
    }
  },

  updateStatus: async (alertId, status, notes = '') => {
    try {
      const response = await api.patch(
        `/api/v1/alerts/alerts/${alertId}/`,
        { status, notes }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update alert status');
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/api/v1/alerts/stats/');
      return {
        total: response.data.total || 0,
        active: response.data.active || 0,
        critical: response.data.critical || 0,
        by_type: response.data.by_type || {},
        by_severity: response.data.by_severity || {},
        by_status: response.data.by_status || {},
        recent_critical: response.data.recent_24h || 0,
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

