import React from 'react';
import { Platform } from 'react-native';

// Platform-specific imports
let MapboxMap = null;
let OSMMap = null;

if (Platform.OS !== 'web') {
  // Only import Mapbox on native platforms
  try {
    MapboxMap = require('./MapboxMap').default;
  } catch (e) {
    console.log('Mapbox not available, using fallback');
  }
}

// Always have OSMMap as fallback
OSMMap = require('./OSMMap').default;

/**
 * Smart Map Component
 * - Uses Mapbox on Mobile (real maps)
 * - Uses OSMMap on Web (no dependencies)
 */
const SmartMap = (props) => {
  // Use Mapbox on mobile if available, otherwise use OSMMap
  const MapComponent = (Platform.OS !== 'web' && MapboxMap) ? MapboxMap : OSMMap;
  
  return <MapComponent {...props} />;
};

export default SmartMap;

