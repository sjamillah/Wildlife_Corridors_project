import React from 'react';
import MapComponent from './MapComponent';

/**
 * Smart Map Component - Native Version
 * - Uses react-native-maps with Esri ArcGIS satellite imagery (matches web app)
 * - Works in Expo Go without API keys
 * - For web, see SmartMap.web.jsx
 */
const SmartMap = (props) => {
  return <MapComponent {...props} />;
};

export default SmartMap;

