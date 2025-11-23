/**
 * Priority Sync Queue
 * Manages offline data sync with priority levels
 * High priority items (GPS tracking) sync immediately when online
 * Medium priority items (checkpoints) sync after high priority
 */

// Lazy load AsyncStorage to avoid SSR issues
let AsyncStorage = null;
const getAsyncStorage = async () => {
  if (AsyncStorage === null) {
    try {
      AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    } catch (error) {
      console.warn('AsyncStorage not available:', error);
      // Return a mock AsyncStorage for web/SSR
      AsyncStorage = {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      };
    }
  }
  return AsyncStorage;
};

// Simple UUID generator
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const STORAGE_KEY = 'priority_sync_queue';

class PrioritySyncQueue {
  constructor() {
    this.queue = [];
    this.syncInterval = null;
    this._loaded = false; // Track if queue has been loaded
  }

  // Load queue from storage
  async loadQueue() {
    try {
      const storage = await getAsyncStorage();
      const data = await storage.getItem(STORAGE_KEY);
      this.queue = data ? JSON.parse(data) : [];
      this._loaded = true;
      return this.queue;
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
      this._loaded = true; // Mark as loaded even if failed to avoid retrying
      return [];
    }
  }

  // Save queue to storage
  async saveQueue() {
    try {
      const storage = await getAsyncStorage();
      await storage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      return true;
    } catch (error) {
      console.error('Failed to save sync queue:', error);
      return false;
    }
  }

  // Add item to queue
  async add(item) {
    // Load queue if not already loaded
    if (!this._loaded) {
      await this.loadQueue();
      this._loaded = true;
    }

    const queueItem = {
      id: uuidv4(),
      ...item,
      createdAt: new Date().toISOString(),
      retries: 0,
      status: 'pending',
      lastRetryAt: null,
    };

    this.queue.push(queueItem);
    await this.saveQueue();

    // Try immediate sync if online
    const isOnline = await this.isOnline();
    if (isOnline) {
      await this.syncByPriority(item.priority);
    }

    return queueItem.id;
  }

  // Get items by priority
  getByPriority(priority) {
    return this.queue.filter(
      (item) => item.priority === priority && item.status === 'pending'
    );
  }

  // Get all pending items
  getPending() {
    return this.queue.filter((item) => item.status === 'pending');
  }

  // Sync items by priority
  async syncByPriority(priority) {
    const items = this.getByPriority(priority);
    
    for (const item of items) {
      try {
        // Import API dynamically
        const api = (await import('./api')).default;
        
        const response = await api.post(item.endpoint, item.data);
        
        // Mark as completed and remove
        item.status = 'completed';
        await this.remove(item.id);
        
        console.log(`✅ Synced ${priority} priority item:`, item.id);
      } catch (error) {
        item.retries++;
        item.lastRetryAt = new Date().toISOString();
        
        // Check max retries
        const maxRetries = item.maxRetries || (priority === 'high' ? 20 : 10);
        if (item.retries >= maxRetries) {
          item.status = 'failed';
          console.error(`❌ Item failed after ${maxRetries} retries:`, item.id);
        }
        
        await this.saveQueue();
        console.warn(`⚠️ Failed to sync item ${item.id}, retry ${item.retries}/${maxRetries}:`, error.message);
      }
    }
  }

  // Sync high priority items
  async syncHighPriority() {
    return await this.syncByPriority('high');
  }

  // Sync medium priority items
  async syncMediumPriority() {
    return await this.syncByPriority('medium');
  }

  // Sync all pending items (high priority first)
  async syncAll() {
    await this.syncHighPriority();
    await this.syncMediumPriority();
  }

  // Remove item from queue
  async remove(id) {
    this.queue = this.queue.filter((item) => item.id !== id);
    await this.saveQueue();
  }

  // Clear completed items
  async clearCompleted() {
    this.queue = this.queue.filter((item) => item.status !== 'completed');
    await this.saveQueue();
  }

  // Get queue stats
  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter((item) => item.status === 'pending').length,
      completed: this.queue.filter((item) => item.status === 'completed').length,
      failed: this.queue.filter((item) => item.status === 'failed').length,
      high: this.getByPriority('high').length,
      medium: this.getByPriority('medium').length,
      low: this.getByPriority('low').length,
    };
  }

  // Check if online
  async isOnline() {
    try {
      const NetInfo = (await import('@react-native-community/netinfo')).default;
      const state = await NetInfo.fetch();
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      return false;
    }
  }

  // Start automatic sync (every 5 seconds for high priority)
  startAutoSync() {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      const isOnline = await this.isOnline();
      if (isOnline) {
        await this.syncHighPriority();
      }
    }, 5000); // Every 5 seconds for high priority
  }

  // Stop automatic sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Export singleton instance
const prioritySyncQueue = new PrioritySyncQueue();

// Don't load queue at module level - load it lazily when first used
// This prevents SSR issues where window/AsyncStorage isn't available

export default prioritySyncQueue;

