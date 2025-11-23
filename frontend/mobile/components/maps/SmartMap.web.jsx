import React from 'react';

/**
 * Smart Map Component - Web Version
 * - Returns null on web platform (react-native-maps doesn't work on web)
 */
const SmartMap = (props) => {
  console.warn('react-native-maps not available on web platform');
  return null;
};

export default SmartMap;

