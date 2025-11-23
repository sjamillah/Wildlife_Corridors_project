import { Platform } from 'react-native';

/**
 * Creates platform-compatible shadow styles
 * For web: uses boxShadow
 * For native: uses shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation
 * 
 * @param {Object} options - Shadow configuration
 * @param {string} options.color - Shadow color (default: '#000')
 * @param {number} options.offsetX - Horizontal offset (default: 0)
 * @param {number} options.offsetY - Vertical offset (default: 2)
 * @param {number} options.opacity - Shadow opacity 0-1 (default: 0.1)
 * @param {number} options.radius - Blur radius (default: 4)
 * @param {number} options.elevation - Android elevation (default: 2)
 * @returns {Object} Platform-compatible shadow styles
 */
export const createShadowStyle = ({
  color = '#000',
  offsetX = 0,
  offsetY = 2,
  opacity = 0.1,
  radius = 4,
  elevation = 2,
} = {}) => {
  return Platform.select({
    web: {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px rgba(${hexToRgb(color)}, ${opacity})`,
    },
    default: {
      shadowColor: color,
      shadowOffset: { width: offsetX, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
      elevation: elevation,
    },
  });
};

/**
 * Helper to convert hex color to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
};

/**
 * Common shadow presets
 */
export const shadowPresets = {
  none: Platform.select({
    web: { boxShadow: 'none' },
    default: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }),
  small: createShadowStyle({ offsetY: 1, opacity: 0.1, radius: 2, elevation: 1 }),
  medium: createShadowStyle({ offsetY: 2, opacity: 0.1, radius: 4, elevation: 2 }),
  large: createShadowStyle({ offsetY: 4, opacity: 0.2, radius: 8, elevation: 4 }),
  xlarge: createShadowStyle({ offsetY: 6, opacity: 0.3, radius: 12, elevation: 8 }),
};

