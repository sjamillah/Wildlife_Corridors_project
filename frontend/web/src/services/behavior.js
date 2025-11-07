import api from './api';

const behavior = {
  analyze: async (animalId, speed, direction = null) => {
    try {
      const response = await api.post('/api/v1/tracking/behavior/analyze/', {
        animal_id: animalId,
        speed_kmh: speed,
        directional_angle: direction
      });
      return response.data;
    } catch (error) {
      console.warn('Behavior analysis endpoint unavailable:', error.message);
      return null;
    }
  },

  getSummary: async (animalId = null, hours = 24) => {
    try {
      const params = new URLSearchParams();
      if (animalId) params.append('animal_id', animalId);
      params.append('hours', hours.toString());
      
      const response = await api.get(`/api/v1/tracking/behavior/summary/?${params}`);
      return response.data;
    } catch (error) {
      console.warn('Behavior summary endpoint unavailable:', error.message);
      return {
        total_animals: 0,
        animals: [],
        distribution: {},
        model_used: 'rule_based'
      };
    }
  },
};

export default behavior;

