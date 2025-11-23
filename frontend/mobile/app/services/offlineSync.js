/**
 * Offline Sync Service
 * Handles syncing offline data when device comes back online
 */

import offlineStorage from './offlineStorage';
import api from './api';
import alertsService from './alerts';
import trackingService from './tracking';

const SYNC_BATCH_SIZE = 10;
const MAX_RETRIES = 3;

const offlineSync = {
  /**
   * Sync all offline data
   */
  async syncAll(onProgress = null) {
    try {
      const stats = await offlineStorage.getStorageStats();
      const total = stats.unsyncedGPS + stats.unsyncedAlerts + stats.syncQueue;
      let synced = 0;

      // Sync GPS locations
      if (stats.unsyncedGPS > 0) {
        const result = await this.syncGPSLocations((count) => {
          synced += count;
          if (onProgress) onProgress({ synced, total, type: 'gps' });
        });
        console.log(`✅ Synced ${result.synced} GPS locations`);
      }

      // Sync alerts
      if (stats.unsyncedAlerts > 0) {
        const result = await this.syncAlerts((count) => {
          synced += count;
          if (onProgress) onProgress({ synced, total, type: 'alerts' });
        });
        console.log(`✅ Synced ${result.synced} alerts`);
      }

      // Sync sync queue
      if (stats.syncQueue > 0) {
        const result = await this.syncQueue((count) => {
          synced += count;
          if (onProgress) onProgress({ synced, total, type: 'queue' });
        });
        console.log(`✅ Synced ${result.synced} queue items`);
      }

      return {
        success: true,
        synced,
        total
      };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Sync GPS locations
   */
  async syncGPSLocations(onProgress = null) {
    try {
      const locations = await offlineStorage.getUnsyncedGPSLocations(SYNC_BATCH_SIZE * 5);
      let synced = 0;
      let failed = 0;

      // Batch sync
      for (let i = 0; i < locations.length; i += SYNC_BATCH_SIZE) {
        const batch = locations.slice(i, i + SYNC_BATCH_SIZE);
        
        try {
          // Send batch to server
          const response = await api.post('/api/v1/tracking/batch/', {
            locations: batch.map(loc => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
              accuracy: loc.accuracy,
              altitude: loc.altitude,
              heading: loc.heading,
              speed: loc.speed,
              timestamp: new Date(loc.timestamp).toISOString()
            }))
          });

          if (response.status === 200 || response.status === 201) {
            // Mark as synced
            const ids = batch.map(loc => loc.id);
            await offlineStorage.markGPSLocationsSynced(ids);
            synced += batch.length;
            
            if (onProgress) onProgress(synced);
          } else {
            failed += batch.length;
          }
    } catch (error) {
          console.error('Failed to sync GPS batch:', error);
          failed += batch.length;
        }
      }

      return { synced, failed, total: locations.length };
    } catch (error) {
      console.error('❌ Failed to sync GPS locations:', error);
      return { synced: 0, failed: 0, total: 0 };
    }
  },

  /**
   * Sync alerts
   */
  async syncAlerts(onProgress = null) {
    try {
      const alerts = await offlineStorage.getUnsyncedAlerts();
      let synced = 0;
      let failed = 0;

      for (const alert of alerts) {
        try {
          // Create alert via API
          const response = await alertsService.create({
            type: alert.type,
            severity: alert.severity,
            latitude: alert.latitude,
            longitude: alert.longitude,
            message: alert.message,
            animal_id: alert.animal_id,
            timestamp: new Date(alert.timestamp).toISOString()
          });

          if (response && response.id) {
            // Mark as synced
            await offlineStorage.markAlertSynced(alert.id);
            synced++;
            
            if (onProgress) onProgress(synced);
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Failed to sync alert ${alert.id}:`, error);
          failed++;
        }
      }

      return { synced, failed, total: alerts.length };
    } catch (error) {
      console.error('❌ Failed to sync alerts:', error);
      return { synced: 0, failed: 0, total: 0 };
    }
  },

  /**
   * Sync sync queue
   */
  async syncQueue(onProgress = null) {
    try {
      const queue = await offlineStorage.getSyncQueue(SYNC_BATCH_SIZE * 5);
      let synced = 0;
      let failed = 0;

      for (const item of queue) {
        try {
          const { table_name, record_id, operation, data } = item;
          
          // Route to appropriate API endpoint based on table
          let success = false;
          
          switch (table_name) {
            case 'offline_alerts':
              if (operation === 'create') {
                const response = await alertsService.create(data);
                success = !!response?.id;
              }
              break;
              
            case 'offline_reports':
              if (operation === 'create') {
                // Use reports service
                const response = await api.post('/api/v1/reports/', data);
                success = response.status === 200 || response.status === 201;
              }
              break;
              
            default:
              console.warn(`Unknown table for sync: ${table_name}`);
          }

          if (success) {
            await offlineStorage.removeFromSyncQueue(item.id);
            synced++;
            
            if (onProgress) onProgress(synced);
          } else {
            // Increment retry count
            item.retry_count = (item.retry_count || 0) + 1;
            if (item.retry_count >= MAX_RETRIES) {
              // Remove after max retries
              await offlineStorage.removeFromSyncQueue(item.id);
              failed++;
            } else {
              failed++;
            }
          }
        } catch (error) {
          console.error(`Failed to sync queue item ${item.id}:`, error);
          failed++;
        }
      }

      return { synced, failed, total: queue.length };
    } catch (error) {
      console.error('❌ Failed to sync queue:', error);
      return { synced: 0, failed: 0, total: 0 };
    }
  },

  /**
   * Auto-sync when online (called by useOfflineMode)
   */
  async autoSync() {
    try {
      const stats = await offlineStorage.getStorageStats();
      const hasUnsyncedData = stats.unsyncedGPS > 0 || 
                             stats.unsyncedAlerts > 0 || 
                             stats.syncQueue > 0;

      if (hasUnsyncedData) {
        console.log('🔄 Auto-syncing offline data...');
        const result = await this.syncAll();
        return result;
      }

      return { success: true, synced: 0, total: 0 };
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
      return { success: false, error: error.message };
    }
    }
};

export default offlineSync;
