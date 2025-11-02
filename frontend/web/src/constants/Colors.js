/**
 * Wildlife Corridors Web App - Color Constants
 * Centralized color system matching the mobile app and CSS variables
 */

// Earth-tone wildlife conservation palette
export const BRAND_COLORS = {
  PRIMARY: '#2E5D45',        // Forest green (Headers)
  SECONDARY: '#E8E3D6',     // Beige sidebar
  ACCENT: '#D84315',        // Burnt orange (CTAs/Alerts)
  HIGHLIGHT: '#E8961C',     // Ochre (Tertiary accent)
  TERRA_COTTA: '#C1440E',   // Terracotta (Secondary accent)
  TEXT: '#2C2416',          // Primary text
  TEXT_SECONDARY: '#6B5E4F', // Secondary text
  TEXT_TERTIARY: '#4A4235', // Tertiary text
  BACKGROUND: '#F5F1E8',    // Cream background
  SURFACE: '#FFFFFF',       // White cards
  BORDER_LIGHT: '#E8E3D6', // Light border
  BORDER_MEDIUM: '#D4CCBA', // Medium border
  MUTED: '#FAFAF8',         // Secondary background
};

// Status colors
export const STATUS_COLORS = {
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
};

// Status tints (light backgrounds)
export const STATUS_TINTS = {
  CRITICAL: '#FEF3F2',
  RANGERS: '#EDF5F0',
  SUCCESS: '#ECFDF5',
  WARNING: '#FEF9E7',
  OFFLINE: '#FAFAF8',
};

// Additional color aliases for easier access
export const COLORS = {
  // Brand colors
  forestGreen: BRAND_COLORS.PRIMARY,
  burntOrange: BRAND_COLORS.ACCENT,
  terracotta: BRAND_COLORS.TERRA_COTTA,
  ochre: BRAND_COLORS.HIGHLIGHT,
  creamBg: BRAND_COLORS.BACKGROUND,
  beigeSidebar: BRAND_COLORS.SECONDARY,
  whiteCard: BRAND_COLORS.SURFACE,
  secondaryBg: BRAND_COLORS.MUTED,
  
  // Text colors
  textPrimary: BRAND_COLORS.TEXT,
  textSecondary: BRAND_COLORS.TEXT_SECONDARY,
  textTertiary: BRAND_COLORS.TEXT_TERTIARY,
  
  // Border colors
  borderLight: BRAND_COLORS.BORDER_LIGHT,
  borderMedium: BRAND_COLORS.BORDER_MEDIUM,
  
  // Status colors
  success: STATUS_COLORS.SUCCESS,
  warning: STATUS_COLORS.WARNING,
  error: STATUS_COLORS.ERROR,
  info: STATUS_COLORS.INFO,
  
  // Status tints
  tintCritical: STATUS_TINTS.CRITICAL,
  tintRangers: STATUS_TINTS.RANGERS,
  tintSuccess: STATUS_TINTS.SUCCESS,
  tintWarning: STATUS_TINTS.WARNING,
  tintOffline: STATUS_TINTS.OFFLINE,
  
  // Common colors
  white: '#FFFFFF',
  black: '#000000',
};

// RGB values for opacity variants (as strings for CSS rgba)
export const RGB_VALUES = {
  forestGreen: '46,93,69',
  burntOrange: '216,67,21',
  statusInfo: '59,130,246',
};

// Helper function to get RGB string for opacity
export const getRGB = (colorName) => {
  return RGB_VALUES[colorName] || '0,0,0';
};

// Helper function to create rgba color
export const rgba = (colorName, opacity = 1) => {
  const rgb = getRGB(colorName);
  return `rgba(${rgb}, ${opacity})`;
};

// Map-specific colors
export const MAP_COLORS = {
  WILDLIFE_NORMAL: BRAND_COLORS.PRIMARY,
  ALERT_CRITICAL: STATUS_COLORS.ERROR,
  ALERT_WARNING: STATUS_COLORS.WARNING,
  PATROL: STATUS_COLORS.INFO,
  MIGRATION: BRAND_COLORS.HIGHLIGHT,
  BREEDING: BRAND_COLORS.ACCENT,
  CAMERA: '#8B5CF6',
  VEHICLE: STATUS_COLORS.WARNING,
  ROUTE: BRAND_COLORS.ACCENT,
  LOCATION: STATUS_COLORS.INFO,
  GRAY_DEFAULT: '#6B7280',
  GRAY_LIGHT: '#9CA3AF',
};

// Default export for convenience
const ColorConstants = {
  BRAND_COLORS,
  STATUS_COLORS,
  STATUS_TINTS,
  COLORS,
  MAP_COLORS,
  RGB_VALUES,
  getRGB,
  rgba,
};

export default ColorConstants;

