import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_QUEUE_KEY = 'offlineDataQueue';

const sync = {
  // Get all sync logs
  getLogs: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/sync/logs/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sync logs');
    }
  },

  // Get sync log by ID
  getLogById: async (id) => {
    try {
      const response = await api.get(`/api/v1/sync/logs/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sync log');
    }
  },

  // Get recent sync logs
  getRecentLogs: async () => {
    try {
      const response = await api.get('/api/v1/sync/logs/recent/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recent sync logs');
    }
  },

  // Get sync statistics
  getStats: async () => {
    try {
      const response = await api.get('/api/v1/sync/logs/stats/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sync statistics');
    }
  },

  // Get sync queue
  getQueue: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/v1/sync/queue/${params ? `?${params}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sync queue');
    }
  },

  // Add item to sync queue
  addToQueue: async (queueData) => {
    try {
      const response = await api.post('/api/v1/sync/queue/', queueData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add to sync queue');
    }
  },

  // Get pending sync items
  getPendingItems: async () => {
    try {
      const response = await api.get('/api/v1/sync/queue/pending/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pending items');
    }
  },

  // Upload offline data (main sync endpoint)
  uploadOfflineData: async (data) => {
    try {
      const response = await api.post('/api/v1/sync/upload/', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload offline data');
    }
  },

  // Local offline queue management
  addToLocalQueue: async (data) => {
    try {
      const queue = await sync.getLocalQueue();
      queue.push({
        ...data,
        timestamp: new Date().toISOString(),
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      return { success: true, queueSize: queue.length };
    } catch (error) {
      throw new Error('Failed to add to local queue');
    }
  },

  getLocalQueue: async () => {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('Error getting local queue:', error);
      return [];
    }
  },

  clearLocalQueue: async () => {
    try {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      return { success: true };
    } catch (error) {
      throw new Error('Failed to clear local queue');
    }
  },

  // Sync local queue with server
  syncLocalQueue: async () => {
    try {
      const queue = await sync.getLocalQueue();
      
      if (queue.length === 0) {
        return { success: true, synced: 0, message: 'No data to sync' };
      }

      // Organize data by type
      const trackingData = queue.filter(item => item.type === 'tracking');
      const observationsData = queue.filter(item => item.type === 'observation');

      // Upload to server
      const response = await sync.uploadOfflineData({
        tracking_data: trackingData.map(item => item.data),
        observations: observationsData.map(item => item.data),
      });

      // Clear local queue after successful sync
      await sync.clearLocalQueue();

      return {
        success: true,
        synced: queue.length,
        response: response,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to sync local queue');
    }
  },

  // Check if online and sync if needed
  autoSync: async () => {
    try {
      // Check if we have internet connection
      const healthCheck = await api.get('/health/');
      
      if (healthCheck.status === 200) {
        return await sync.syncLocalQueue();
      }
      
      return { success: false, message: 'No internet connection' };
    } catch (error) {
      // If health check fails, we're offline
      return { success: false, message: 'Offline - data queued for later sync' };
    }
  },
};

export default sync;

