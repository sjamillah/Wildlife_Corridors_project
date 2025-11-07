import api from './api';

const reports = {
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

  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/reports/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch report details');
    }
  },

  getByCategory: async (categoryId) => {
    try {
      const response = await api.get(`/api/v1/reports/?category=${categoryId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reports by category');
    }
  },

  generate: async (reportData) => {
    try {
      const response = await api.post('/api/v1/reports/generate/', reportData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate report');
    }
  },

  download: async (reportId) => {
    try {
      const response = await api.get(`/api/v1/reports/${reportId}/download/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download report');
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/api/v1/reports/stats/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch report statistics');
    }
  },

  getTrends: async (days = 30) => {
    try {
      const response = await api.get(`/api/v1/reports/trends/?days=${days}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch report trends');
    }
  },

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

    delete: async (id) => {
      try {
        await api.delete(`/api/v1/reports/categories/${id}/`);
        return { success: true };
      } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete category');
      }
    },
  },

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
