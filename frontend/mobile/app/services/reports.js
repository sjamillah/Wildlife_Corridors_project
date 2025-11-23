import api from './api';

const reports = {
  // Get all reports with optional filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/reports/reports/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reports');
    }
  },

  // Get report by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/reports/reports/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch report details');
    }
  },

  // Create new report
  create: async (reportData) => {
    try {
      const response = await api.post('/api/v1/reports/reports/', reportData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create report');
    }
  },

  // Update report (full update)
  update: async (id, reportData) => {
    try {
      const response = await api.put(`/api/v1/reports/reports/${id}/`, reportData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update report');
    }
  },

  // Partial update report
  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/reports/reports/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update report');
    }
  },

  // Delete report
  delete: async (id) => {
    try {
      await api.delete(`/api/v1/reports/reports/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete report');
    }
  },

  // Get reports by category
  getByCategory: async (categoryId) => {
    try {
      const response = await api.get(`/api/v1/reports/reports/?category=${categoryId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reports by category');
    }
  },

  // Generate new report
  generate: async (reportData) => {
    try {
      const response = await api.post('/api/v1/reports/reports/generate/', reportData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate report');
    }
  },

  // Download report
  download: async (reportId) => {
    try {
      const response = await api.get(`/api/v1/reports/reports/${reportId}/download/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download report');
    }
  },

  // Get report statistics
  getStats: async () => {
    try {
      const response = await api.get('/api/v1/reports/reports/stats/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch report statistics');
    }
  },

  // Get report trends
  getTrends: async (days = 30) => {
    try {
      const response = await api.get(`/api/v1/reports/reports/trends/?days=${days}`);
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

    create: async (categoryData) => {
      try {
        const response = await api.post('/api/v1/reports/categories/', categoryData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create category');
      }
    },

    update: async (id, categoryData) => {
      try {
        const response = await api.put(`/api/v1/reports/categories/${id}/`, categoryData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update category');
      }
    },

    patch: async (id, partialData) => {
      try {
        const response = await api.patch(`/api/v1/reports/categories/${id}/`, partialData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update category');
      }
    },

    delete: async (id) => {
      try {
        await api.delete(`/api/v1/reports/categories/${id}/`);
        return { success: true };
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete category');
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

    create: async (templateData) => {
      try {
        const response = await api.post('/api/v1/reports/templates/', templateData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create template');
      }
    },

    update: async (id, templateData) => {
      try {
        const response = await api.put(`/api/v1/reports/templates/${id}/`, templateData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update template');
      }
    },

    patch: async (id, partialData) => {
      try {
        const response = await api.patch(`/api/v1/reports/templates/${id}/`, partialData);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update template');
      }
    },

    delete: async (id) => {
      try {
        await api.delete(`/api/v1/reports/templates/${id}/`);
        return { success: true };
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete template');
      }
    },
  },
};

export default reports;

