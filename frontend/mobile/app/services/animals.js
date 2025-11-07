import api from './api';

const animals = {
  // Get all animals with optional filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/animals/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch animals');
    }
  },

  // Get animal by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/api/v1/animals/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch animal details');
    }
  },

  // Create new animal
  create: async (animalData) => {
    try {
      const response = await api.post('/api/v1/animals/', animalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create animal');
    }
  },

  // Update animal (full update)
  update: async (id, animalData) => {
    try {
      const response = await api.put(`/api/v1/animals/${id}/`, animalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update animal');
    }
  },

  // Partial update animal
  patch: async (id, partialData) => {
    try {
      const response = await api.patch(`/api/v1/animals/${id}/`, partialData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update animal');
    }
  },

  // Delete animal
  delete: async (id) => {
    try {
      await api.delete(`/api/v1/animals/${id}/`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete animal');
    }
  },

  // Get live status of all animals (real-time tracking + AI predictions)
  getLiveStatus: async () => {
    try {
      const response = await api.get('/api/v1/animals/live_status/');
      
      // Transform backend response to match frontend expectations
      // Backend returns nested objects (current_position, predicted_position, etc.)
      // Frontend expects flat structure with current_lat, current_lon, etc.
      const transformedData = (response.data || []).map(animal => ({
        animal_id: animal.animal_id,
        animal: animal.name,
        animal_name: animal.name,
        species: animal.species,
        collar_id: animal.collar_id,
        
        // Flatten current position
        current_lat: animal.current_position?.lat || 0,
        current_lon: animal.current_position?.lon || 0,
        altitude: animal.current_position?.altitude || 0,
        timestamp: animal.current_position?.timestamp || animal.last_update,
        last_updated: animal.last_update,
        
        // Flatten predicted position
        predicted_lat: animal.predicted_position?.lat || animal.current_position?.lat || 0,
        predicted_lon: animal.predicted_position?.lon || animal.current_position?.lon || 0,
        prediction_time: animal.predicted_position?.prediction_time,
        
        // Flatten movement data
        speed_kmh: animal.movement?.speed_kmh || 0,
        directional_angle: animal.movement?.directional_angle || 0,
        battery_level: animal.movement?.battery_level || 0,
        battery: animal.movement?.battery_level || 0,
        signal_strength: animal.movement?.signal_strength || 'Unknown',
        
        // Flatten corridor status
        in_corridor: animal.corridor_status?.inside_corridor || false,
        corridor_name: animal.corridor_status?.corridor_name || null,
        predicted_in_corridor: animal.corridor_status?.predicted_in_corridor || false,
        predicted_corridor_name: animal.corridor_status?.predicted_corridor_name || null,
        
        // Flatten conflict risk
        risk_level: animal.conflict_risk?.current?.risk_level || 'Low',
        risk_reason: animal.conflict_risk?.current?.reason || 'No immediate threats',
        distance_to_conflict_km: animal.conflict_risk?.current?.distance_to_conflict_km || null,
        conflict_zone: animal.conflict_risk?.current?.conflict_zone || null,
        conflict_zone_type: animal.conflict_risk?.current?.conflict_zone?.zone_type || null,
        
        // Predicted conflict risk
        predicted_risk_level: animal.conflict_risk?.predicted?.risk_level || 'Low',
        predicted_risk_reason: animal.conflict_risk?.predicted?.reason || 'No predicted threats',
        
        // Keep original nested data for advanced use
        _original: animal,
        
        // Default fields for compatibility
        status: 'active',
        health_status: 'Good',
        activity_type: 'Unknown',
        synced: true,
      }));
      
      return { results: transformedData };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch live status');
    }
  },

  // Get animals by species
  getBySpecies: async (species) => {
    try {
      const response = await api.get(`/api/v1/animals/?species=${species}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch animals by species');
    }
  },

  // Get active animals only
  getActive: async () => {
    try {
      const response = await api.get('/api/v1/animals/?status=active');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active animals');
    }
  },
};

export default animals;

