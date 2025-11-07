import api from './api';

const corridors = {
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/corridors/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch corridors');
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/corridors/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch corridor');
    }
  },

  create: async (corridorData) => {
    try {
      const response = await api.post('/api/v1/corridors/', corridorData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create corridor');
    }
  },

  update: async (id, corridorData) => {
    try {
      const response = await api.put(`/api/v1/corridors/${id}/`, corridorData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update corridor');
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/api/v1/corridors/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete corridor');
    }
  },

  optimize: async ({
    species,
    startPoint,
    endPoint,
    steps = 50,
  }) => {
    try {
      const response = await api.post('/api/v1/corridors/optimize/', {
        species,
        start_point: startPoint,
        end_point: endPoint,
        steps,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to optimize corridor');
    }
  },

  getBySpecies: async (species) => {
    try {
      const response = await api.get(`/api/v1/corridors/?species=${species}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch corridors by species');
    }
  },

  getActive: async () => {
    try {
      const response = await api.get('/api/v1/corridors/?status=active');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active corridors');
    }
  },
};

export default corridors;


