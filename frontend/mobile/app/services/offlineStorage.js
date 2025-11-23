/**
 * Offline Storage Service
 * Uses AsyncStorage for all offline data storage (works on web and native)
 * Since we're using Supabase, we don't need SQLite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  GPS_LOCATIONS: 'offline_gps_locations',
  ANIMALS: 'offline_animals',
  ALERTS: 'offline_alerts',
  REPORTS: 'offline_reports',
  SYNC_QUEUE: 'offline_sync_queue',
  MAP_TILES: 'map_tiles_metadata',
};

// Helper functions
const getStoredData = async (key) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`❌ Failed to get stored data for ${key}:`, error);
    return [];
  }
};

const saveStoredData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`❌ Failed to save data for ${key}:`, error);
    return false;
  }
};

const offlineStorage = {
  /**
   * GPS Location Storage
   */
  async saveGPSLocation(location) {
    try {
      const locations = await getStoredData(STORAGE_KEYS.GPS_LOCATIONS);
      const { latitude, longitude, accuracy, altitude, heading, speed } = location;
      const timestamp = Date.now();
      
      locations.push({
        id: `gps_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        latitude,
        longitude,
        accuracy: accuracy || null,
        altitude: altitude || null,
        heading: heading || null,
        speed: speed || null,
        timestamp,
        synced: 0,
        created_at: timestamp,
      });
      
      // Keep only last 1000 locations to prevent storage bloat
      if (locations.length > 1000) {
        locations.splice(0, locations.length - 1000);
      }
      
      await saveStoredData(STORAGE_KEYS.GPS_LOCATIONS, locations);
      console.log('📍 GPS location saved offline:', { latitude, longitude, timestamp });
      return true;
    } catch (error) {
      console.error('❌ Failed to save GPS location:', error);
      return false;
    }
  },

  async getUnsyncedGPSLocations(limit = 100) {
    try {
      const locations = await getStoredData(STORAGE_KEYS.GPS_LOCATIONS);
      const unsynced = locations
        .filter(loc => loc.synced === 0)
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, limit);
      
      return unsynced;
    } catch (error) {
      console.error('❌ Failed to get unsynced GPS locations:', error);
      return [];
    }
  },

  async markGPSLocationsSynced(ids) {
    try {
      const locations = await getStoredData(STORAGE_KEYS.GPS_LOCATIONS);
      const updated = locations.map(loc => 
        ids.includes(loc.id) ? { ...loc, synced: 1 } : loc
      );
      
      await saveStoredData(STORAGE_KEYS.GPS_LOCATIONS, updated);
      return true;
    } catch (error) {
      console.error('❌ Failed to mark GPS locations as synced:', error);
      return false;
    }
  },

  /**
   * Animal Data Storage
   */
  async saveAnimal(animal) {
    try {
      const animals = await getStoredData(STORAGE_KEYS.ANIMALS);
      const existingIndex = animals.findIndex(a => a.id === animal.id);
      
      const animalData = {
        id: animal.id,
        name: animal.name,
        species: animal.species,
        coordinates: animal.coordinates,
        status: animal.status,
        health_status: animal.health_status,
        last_seen: animal.last_seen || Date.now(),
        data: animal,
        synced: 0,
        updated_at: Date.now(),
      };
      
      if (existingIndex >= 0) {
        animals[existingIndex] = animalData;
      } else {
        animals.push(animalData);
      }
      
      await saveStoredData(STORAGE_KEYS.ANIMALS, animals);
      return true;
    } catch (error) {
      console.error('❌ Failed to save animal:', error);
      return false;
    }
  },

  async getAnimals() {
    try {
      const animals = await getStoredData(STORAGE_KEYS.ANIMALS);
      return animals.map(animal => animal.data).sort((a, b) => b.updated_at - a.updated_at);
    } catch (error) {
      console.error('❌ Failed to get animals:', error);
      return [];
    }
  },

  /**
   * Alert Storage
   */
  async saveAlert(alert) {
    try {
      const alerts = await getStoredData(STORAGE_KEYS.ALERTS);
      const alertId = alert.id || `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const alertData = {
        id: alertId,
        type: alert.type,
        severity: alert.severity,
        latitude: alert.latitude,
        longitude: alert.longitude,
        message: alert.message,
        animal_id: alert.animal_id,
        timestamp: alert.timestamp || Date.now(),
        synced: 0,
        created_at: Date.now(),
      };
      
      alerts.push(alertData);
      
      // Add to sync queue
      await this.addToSyncQueue('offline_alerts', alertId, 'create', alert);
      
      await saveStoredData(STORAGE_KEYS.ALERTS, alerts);
      return alertId;
    } catch (error) {
      console.error('❌ Failed to save alert:', error);
      return null;
    }
  },

  async getUnsyncedAlerts() {
    try {
      const alerts = await getStoredData(STORAGE_KEYS.ALERTS);
      return alerts
        .filter(alert => alert.synced === 0)
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('❌ Failed to get unsynced alerts:', error);
      return [];
    }
  },

  async markAlertSynced(alertId) {
    try {
      const alerts = await getStoredData(STORAGE_KEYS.ALERTS);
      const updated = alerts.map(alert => 
        alert.id === alertId ? { ...alert, synced: 1 } : alert
      );
      
      await saveStoredData(STORAGE_KEYS.ALERTS, updated);
      return true;
    } catch (error) {
      console.error('❌ Failed to mark alert as synced:', error);
      return false;
    }
  },

  /**
   * Sync Queue Management
   */
  async addToSyncQueue(tableName, recordId, operation, data) {
    try {
      const queue = await getStoredData(STORAGE_KEYS.SYNC_QUEUE);
      
      queue.push({
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        table_name: tableName,
        record_id: recordId,
        operation,
        data,
        retry_count: 0,
        created_at: Date.now(),
      });
      
      await saveStoredData(STORAGE_KEYS.SYNC_QUEUE, queue);
      return true;
    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error);
      return false;
    }
  },

  async getSyncQueue(limit = 50) {
    try {
      const queue = await getStoredData(STORAGE_KEYS.SYNC_QUEUE);
      return queue
        .sort((a, b) => a.created_at - b.created_at)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get sync queue:', error);
      return [];
    }
  },

  async removeFromSyncQueue(id) {
    try {
      const queue = await getStoredData(STORAGE_KEYS.SYNC_QUEUE);
      const filtered = queue.filter(item => item.id !== id);
      await saveStoredData(STORAGE_KEYS.SYNC_QUEUE, filtered);
      return true;
    } catch (error) {
      console.error('❌ Failed to remove from sync queue:', error);
      return false;
    }
  },

  /**
   * Map Tiles Cache (using AsyncStorage for metadata)
   */
  async saveMapTileMetadata(region, zoomLevel) {
    try {
      const tiles = await getStoredData(STORAGE_KEYS.MAP_TILES);
      const key = `map_tile_${zoomLevel}_${region.latitude.toFixed(2)}_${region.longitude.toFixed(2)}`;
      
      const tileData = {
        key,
        region,
        zoomLevel,
        timestamp: Date.now(),
      };
      
      // Remove old entry if exists
      const filtered = tiles.filter(t => t.key !== key);
      filtered.push(tileData);
      
      await saveStoredData(STORAGE_KEYS.MAP_TILES, filtered);
      return true;
    } catch (error) {
      console.error('❌ Failed to save map tile metadata:', error);
      return false;
    }
  },

  async getCachedMapRegions() {
    try {
      const tiles = await getStoredData(STORAGE_KEYS.MAP_TILES);
      return tiles.map(tile => ({
        region: tile.region,
        zoomLevel: tile.zoomLevel,
        timestamp: tile.timestamp,
      }));
    } catch (error) {
      console.error('❌ Failed to get cached map regions:', error);
      return [];
    }
  },

  /**
   * Clear old data
   */
  async clearOldGPSLocations(daysOld = 7) {
    try {
      const locations = await getStoredData(STORAGE_KEYS.GPS_LOCATIONS);
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const filtered = locations.filter(loc => 
        loc.timestamp >= cutoffTime || loc.synced === 0
      );
      
      await saveStoredData(STORAGE_KEYS.GPS_LOCATIONS, filtered);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear old GPS locations:', error);
      return false;
    }
  },

  /**
   * Get storage stats
   */
  async getStorageStats() {
    try {
      const locations = await getStoredData(STORAGE_KEYS.GPS_LOCATIONS);
      const alerts = await getStoredData(STORAGE_KEYS.ALERTS);
      const queue = await getStoredData(STORAGE_KEYS.SYNC_QUEUE);
      
      return {
        unsyncedGPS: locations.filter(loc => loc.synced === 0).length,
        unsyncedAlerts: alerts.filter(alert => alert.synced === 0).length,
        syncQueue: queue.length,
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return { unsyncedGPS: 0, unsyncedAlerts: 0, syncQueue: 0 };
    }
  }
};

export default offlineStorage;
