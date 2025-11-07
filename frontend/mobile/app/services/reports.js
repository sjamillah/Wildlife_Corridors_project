import api from './api';

const reports = {
  // Get all reports with optional filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/reports/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reports');
    }
  },

  // Get report by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/reports/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch report details');
    }
  },

  // Get reports by category
  getByCategory: async (categoryId) => {
    try {
      const response = await api.get(`/api/v1/reports/?category=${categoryId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reports by category');
    }
  },

  // Generate new report
  generate: async (reportData) => {
    try {
      const response = await api.post('/api/v1/reports/generate/', reportData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate report');
    }
  },

  // Download report
  download: async (reportId) => {
    try {
      const response = await api.get(`/api/v1/reports/${reportId}/download/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download report');
    }
  },

  // Get report statistics
  getStats: async () => {
    try {
      const response = await api.get('/api/v1/reports/stats/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch report statistics');
    }
  },

  // Get report trends
  getTrends: async (days = 30) => {
    try {
      const response = await api.get(`/api/v1/reports/trends/?days=${days}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch report trends');
    }
  },

  // Categories
  categories: {
    getAll: async () => {
      try {
        const response = await api.get('/api/v1/reports/categories/');
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch categories');
      }
    },

    getById: async (id) => {
      try {
        const response = await api.get(`/api/v1/reports/categories/${id}/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch category');
      }
    },
  },

  // Templates
  templates: {
    getAll: async (filters = {}) => {
      try {
        const params = new URLSearchParams(filters).toString();
        const url = `/api/v1/reports/templates/${params ? `?${params}` : ''}`;
        const response = await api.get(url);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch templates');
      }
    },

    getById: async (id) => {
      try {
        const response = await api.get(`/api/v1/reports/templates/${id}/`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch template');
      }
    },
  },
};

export default reports;

