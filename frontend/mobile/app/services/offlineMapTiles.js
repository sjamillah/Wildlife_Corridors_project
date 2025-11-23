/**
 * Offline Map Tiles Service
 * Handles downloading, storing, and loading OpenStreetMap tiles for offline use
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TILES_DIR = `${FileSystem.documentDirectory}tiles/`;
const MAX_CACHE_SIZE_MB = 500; // Maximum cache size in MB
const TILE_SIZE_KB = 20; // Average tile size in KB

/**
 * OpenStreetMap tile URL template
 * Format: https://tile.openstreetmap.org/{z}/{x}/{y}.png
 */
const getTileURL = (z, x, y) => {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
};

/**
 * Calculate tile coordinates from lat/lng and zoom
 */
const latLngToTile = (lat, lng, zoom) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y, z: zoom };
};

/**
 * Get all tiles for a bounding box
 */
const getTilesForBounds = (north, south, east, west, minZoom, maxZoom) => {
  const tiles = [];
  
  for (let z = minZoom; z <= maxZoom; z++) {
    const nwTile = latLngToTile(north, west, z);
    const seTile = latLngToTile(south, east, z);
    
    for (let x = nwTile.x; x <= seTile.x; x++) {
      for (let y = nwTile.y; y <= seTile.y; y++) {
        tiles.push({ x, y, z });
      }
    }
  }
  
  return tiles;
};

/**
 * Get local file path for a tile
 */
const getTilePath = (z, x, y) => {
  return `${TILES_DIR}${z}/${x}/${y}.png`;
};

/**
 * Initialize tiles directory
 */
const initTilesDirectory = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(TILES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(TILES_DIR, { intermediates: true });
      console.log('✅ Tiles directory created');
    }
  } catch (error) {
    console.error('❌ Failed to create tiles directory:', error);
  }
};

/**
 * Download a single tile
 */
const downloadTile = async (z, x, y) => {
  try {
    const tilePath = getTilePath(z, x, y);
    const fileInfo = await FileSystem.getInfoAsync(tilePath);
    
    // Skip if already downloaded
    if (fileInfo.exists) {
      return { success: true, cached: true };
    }
    
    // Create directory if needed
    const dirPath = `${TILES_DIR}${z}/${x}/`;
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    
    // Download tile
    const url = getTileURL(z, x, y);
    const downloadResult = await FileSystem.downloadAsync(url, tilePath);
    
    if (downloadResult.status === 200) {
      // Save metadata
      await AsyncStorage.setItem(
        `tile_${z}_${x}_${y}`,
        JSON.stringify({ z, x, y, timestamp: Date.now() })
      );
      
      return { success: true, cached: false };
    }
    
    return { success: false, error: 'Download failed' };
  } catch (error) {
    console.error(`❌ Failed to download tile ${z}/${x}/${y}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Download tiles for a region
 */
const downloadTilesForRegion = async (region, minZoom = 6, maxZoom = 14, onProgress = null) => {
  try {
    await initTilesDirectory();
    
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const north = latitude + latitudeDelta / 2;
    const south = latitude - latitudeDelta / 2;
    const east = longitude + longitudeDelta / 2;
    const west = longitude - longitudeDelta / 2;
    
    const tiles = getTilesForBounds(north, south, east, west, minZoom, maxZoom);
    const totalTiles = tiles.length;
    let downloaded = 0;
    let cached = 0;
    let failed = 0;
    
    console.log(`📥 Downloading ${totalTiles} tiles for region...`);
    
    // Download in batches to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < tiles.length; i += batchSize) {
      const batch = tiles.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(tile => downloadTile(tile.z, tile.x, tile.y))
      );
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            if (result.value.cached) {
              cached++;
            } else {
              downloaded++;
            }
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      });
      
      const progress = ((i + batch.length) / totalTiles) * 100;
      if (onProgress) {
        onProgress({
          progress,
          downloaded,
          cached,
          failed,
          total: totalTiles
        });
      }
    }
    
    console.log(`✅ Tile download complete: ${downloaded} new, ${cached} cached, ${failed} failed`);
    
    return {
      success: true,
      downloaded,
      cached,
      failed,
      total: totalTiles
    };
  } catch (error) {
    console.error('❌ Failed to download tiles for region:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if tile exists locally
 */
const tileExists = async (z, x, y) => {
  try {
    const tilePath = getTilePath(z, x, y);
    const fileInfo = await FileSystem.getInfoAsync(tilePath);
    return fileInfo.exists;
  } catch (error) {
    return false;
  }
};

/**
 * Get local tile URL for react-native-maps
 */
const getLocalTileURL = (z, x, y) => {
  const tilePath = getTilePath(z, x, y);
  // For react-native-maps, we need to use file:// protocol
  return Platform.OS === 'ios' 
    ? tilePath.replace(FileSystem.documentDirectory, 'file://')
    : `file://${tilePath}`;
};

/**
 * Clear old tiles to free up space
 */
const clearOldTiles = async (daysOld = 30) => {
  try {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const keys = await AsyncStorage.getAllKeys();
    const tileKeys = keys.filter(k => k.startsWith('tile_'));
    
    let cleared = 0;
    for (const key of tileKeys) {
      const metadata = JSON.parse(await AsyncStorage.getItem(key));
      if (metadata.timestamp < cutoffTime) {
        const { z, x, y } = metadata;
        const tilePath = getTilePath(z, x, y);
        
        try {
          await FileSystem.deleteAsync(tilePath, { idempotent: true });
          await AsyncStorage.removeItem(key);
          cleared++;
        } catch (error) {
          console.warn(`Failed to delete tile ${z}/${x}/${y}:`, error);
        }
      }
    }
    
    console.log(`🗑️ Cleared ${cleared} old tiles`);
    return cleared;
  } catch (error) {
    console.error('❌ Failed to clear old tiles:', error);
    return 0;
  }
};

/**
 * Get cache size
 */
const getCacheSize = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(TILES_DIR);
    if (!dirInfo.exists) return { size: 0, sizeMB: 0 };
    
    // Calculate directory size recursively
    const calculateSize = async (path) => {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        if (info.isDirectory) {
          const files = await FileSystem.readDirectoryAsync(path);
          let totalSize = 0;
          for (const file of files) {
            totalSize += await calculateSize(`${path}/${file}`);
          }
          return totalSize;
        } else {
          return info.size || 0;
        }
      }
      return 0;
    };
    
    const size = await calculateSize(TILES_DIR);
    return { size, sizeMB: (size / (1024 * 1024)).toFixed(2) };
  } catch (error) {
    console.error('❌ Failed to get cache size:', error);
    return { size: 0, sizeMB: 0 };
  }
};

const offlineMapTiles = {
  initTilesDirectory,
  downloadTile,
  downloadTilesForRegion,
  tileExists,
  getLocalTileURL,
  clearOldTiles,
  getCacheSize,
  getTileURL,
  latLngToTile,
  getTilesForBounds
};

export default offlineMapTiles;

