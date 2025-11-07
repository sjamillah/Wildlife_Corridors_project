// Primary brand color for mobile app - Forest Green for headers
const tintColorLight = '#2E5D45';

// Earth-tone wildlife conservation palette
export const BRAND_COLORS = {
  PRIMARY: '#2E5D45',        // Forest green
  SECONDARY: '#E8E3D6',      // Beige sidebar
  ACCENT: '#D84315',         // Burnt orange
  HIGHLIGHT: '#E8961C',      // Ochre
  TERRA_COTTA: '#C1440E',    // Terracotta
  TEXT: '#2C2416',           // Primary text
  TEXT_PRIMARY: '#2C2416',   // Primary text (alias)
  TEXT_SECONDARY: '#6B5E4F', // Secondary text
  TEXT_TERTIARY: '#4A4235',  // Tertiary text
  BACKGROUND: '#F5F1E8',     // Cream background
  CREAM_BG: '#F5F1E8',       // Cream background (alias)
  SURFACE: '#FFFFFF',        // White cards
  BORDER_LIGHT: '#E8E3D6',   // Light border
  BORDER_MEDIUM: '#D4CCBA',  // Medium border
  MUTED: '#FAFAF8',          // Secondary background
};

export const STATUS_COLORS = {
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
};

export const STATUS_TINTS = {
  CRITICAL: '#FEF3F2',
  RANGERS: '#EDF5F0',
  SUCCESS: '#ECFDF5',
  WARNING: '#FEF9E7',
  OFFLINE: '#FAFAF8',
};

export const DARK_MODE_COLORS = {
  PRIMARY: '#5A8A6F',         // Lighter forest green
  SECONDARY: '#4A7C60',
  ACCENT: '#FF6B47',          // Lighter burnt orange
  TEXT: '#F5F1E8',
  TEXT_SECONDARY: '#C7BEB5',
  BACKGROUND: '#1A1A1A',
  SURFACE: '#2E2E2E',         // Dark surface
  BORDER: '#3A3A3A',
  MUTED: '#252525',
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
  MAP_BACKGROUND: '#1a4d2e',
  ROUTE: BRAND_COLORS.ACCENT,
  LOCATION: STATUS_COLORS.INFO,
  GRAY_DEFAULT: '#6B7280',
  GRAY_LIGHT: '#9CA3AF',
};

// UI-specific colors
export const UI_COLORS = {
  ICON_DEFAULT: '#000000',
  ICON_BG: '#f0f0f0',
  BUTTON_DISABLED: '#94a3b8',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY_MID: '#666666',
};

// Main Colors object for theme-based access
export const Colors = {
  light: {
    // Core brand colors matching web app
    text: BRAND_COLORS.TEXT,
    background: BRAND_COLORS.BACKGROUND,
    surface: BRAND_COLORS.SURFACE,
    cardBackground: BRAND_COLORS.SURFACE,
    headerBackground: BRAND_COLORS.BACKGROUND,
    tint: tintColorLight,
    
    // Earth-tone brand palette
    forestGreen: BRAND_COLORS.PRIMARY,
    burntOrange: BRAND_COLORS.ACCENT,
    terracotta: BRAND_COLORS.TERRA_COTTA,
    ochre: BRAND_COLORS.HIGHLIGHT,
    creamBg: BRAND_COLORS.BACKGROUND,
    beigeSidebar: BRAND_COLORS.SECONDARY,
    whiteCard: BRAND_COLORS.SURFACE,
    secondaryBg: BRAND_COLORS.MUTED,
    
    // Legacy brand palette aliases
    brandPrimary: BRAND_COLORS.PRIMARY,
    brandSecondary: BRAND_COLORS.SECONDARY,
    brandAccent: BRAND_COLORS.ACCENT,
    brandHighlight: BRAND_COLORS.HIGHLIGHT,
    brandText: BRAND_COLORS.TEXT,
    brandTextSecondary: BRAND_COLORS.TEXT_SECONDARY,
    brandBg: BRAND_COLORS.BACKGROUND,
    brandSurface: BRAND_COLORS.SURFACE,
    brandBorder: BRAND_COLORS.BORDER_LIGHT,
    brandMuted: BRAND_COLORS.MUTED,
    
    // Text colors
    textPrimary: BRAND_COLORS.TEXT,
    textSecondary: BRAND_COLORS.TEXT_SECONDARY,
    textTertiary: BRAND_COLORS.TEXT_TERTIARY,
    
    // Border colors
    borderLight: BRAND_COLORS.BORDER_LIGHT,
    borderMedium: BRAND_COLORS.BORDER_MEDIUM,
    
    // UI elements
    icon: BRAND_COLORS.TEXT_SECONDARY,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    tabBackground: BRAND_COLORS.SURFACE,
    border: BRAND_COLORS.BORDER_LIGHT,
    
    // Status colors
    accent: {
      primary: BRAND_COLORS.PRIMARY,
      secondary: BRAND_COLORS.SECONDARY,
      warning: STATUS_COLORS.WARNING,
      danger: STATUS_COLORS.ERROR,
      success: STATUS_COLORS.SUCCESS,
      info: STATUS_COLORS.INFO,
    },
    
    // Status tints
    statusTints: {
      critical: STATUS_TINTS.CRITICAL,
      rangers: STATUS_TINTS.RANGERS,
      success: STATUS_TINTS.SUCCESS,
      warning: STATUS_TINTS.WARNING,
      offline: STATUS_TINTS.OFFLINE,
    }
  },
  dark: {
    // Dark mode colors
    text: DARK_MODE_COLORS.TEXT,
    background: DARK_MODE_COLORS.BACKGROUND,
    surface: DARK_MODE_COLORS.SURFACE,
    cardBackground: DARK_MODE_COLORS.SURFACE,
    headerBackground: DARK_MODE_COLORS.BACKGROUND,
    tint: DARK_MODE_COLORS.PRIMARY,
    
    // Earth-tone dark mode palette
    forestGreen: DARK_MODE_COLORS.PRIMARY,
    burntOrange: DARK_MODE_COLORS.ACCENT,
    terracotta: DARK_MODE_COLORS.ACCENT,
    ochre: DARK_MODE_COLORS.ACCENT,
    creamBg: DARK_MODE_COLORS.BACKGROUND,
    beigeSidebar: DARK_MODE_COLORS.BACKGROUND,
    whiteCard: DARK_MODE_COLORS.SURFACE,
    secondaryBg: DARK_MODE_COLORS.MUTED,
    
    // Legacy brand palette (dark mode variants)
    brandPrimary: DARK_MODE_COLORS.PRIMARY,
    brandSecondary: DARK_MODE_COLORS.SECONDARY,
    brandAccent: DARK_MODE_COLORS.ACCENT,
    brandHighlight: DARK_MODE_COLORS.PRIMARY,
    brandText: DARK_MODE_COLORS.TEXT,
    brandTextSecondary: DARK_MODE_COLORS.TEXT_SECONDARY,
    brandBg: DARK_MODE_COLORS.BACKGROUND,
    brandSurface: DARK_MODE_COLORS.SURFACE,
    brandBorder: DARK_MODE_COLORS.BORDER,
    brandMuted: DARK_MODE_COLORS.MUTED,
    
    // Text colors
    textPrimary: DARK_MODE_COLORS.TEXT,
    textSecondary: DARK_MODE_COLORS.TEXT_SECONDARY,
    textTertiary: DARK_MODE_COLORS.TEXT_SECONDARY,
    
    // Border colors
    borderLight: DARK_MODE_COLORS.BORDER,
    borderMedium: DARK_MODE_COLORS.BORDER,
    
    // UI elements
    icon: DARK_MODE_COLORS.TEXT_SECONDARY,
    tabIconDefault: '#6B7280',
    tabIconSelected: DARK_MODE_COLORS.PRIMARY,
    tabBackground: DARK_MODE_COLORS.SURFACE,
    border: DARK_MODE_COLORS.BORDER,
    
    // Status colors (adjusted for dark mode)
    accent: {
      primary: DARK_MODE_COLORS.PRIMARY,
      secondary: DARK_MODE_COLORS.SECONDARY,
      warning: STATUS_COLORS.WARNING,
      danger: STATUS_COLORS.ERROR,
      success: STATUS_COLORS.SUCCESS,
      info: STATUS_COLORS.INFO,
    },
    
    // Status tints (muted for dark mode)
    statusTints: {
      critical: 'rgba(254, 243, 242, 0.1)',
      rangers: 'rgba(237, 245, 240, 0.1)',
      success: 'rgba(236, 253, 245, 0.1)',
      warning: 'rgba(254, 249, 231, 0.1)',
      offline: DARK_MODE_COLORS.MUTED,
    }
  },
};

// Utility functions for easy color access
export const getBrandColor = (colorName, theme = 'light') => {
  const colorMap = {
    primary: Colors[theme].brandPrimary,
    secondary: Colors[theme].brandSecondary,
    accent: Colors[theme].brandAccent,
    highlight: Colors[theme].brandHighlight,
    text: Colors[theme].brandText,
    textSecondary: Colors[theme].brandTextSecondary,
    background: Colors[theme].brandBg,
    surface: Colors[theme].brandSurface,
    border: Colors[theme].brandBorder,
    muted: Colors[theme].brandMuted,
  };
  return colorMap[colorName] || Colors[theme].brandPrimary;
};

export const getStatusColor = (status, theme = 'light') => {
  return Colors[theme].accent[status] || Colors[theme].accent.primary;
};

/**
 * Get color with opacity
 * @param {string} color - The color value
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} Color with opacity
 */
export const withOpacity = (color, opacity) => {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Export commonly used color combinations
export const COMMON_COLORS = {
  // Button combinations
  primaryButton: {
    background: BRAND_COLORS.PRIMARY,  // Forest green
    text: '#FFFFFF',
  },
  secondaryButton: {
    background: BRAND_COLORS.ACCENT,   // Burnt orange
    text: '#FFFFFF',
  },
  
  // Card combinations
  card: {
    background: BRAND_COLORS.SURFACE,     // White
    border: BRAND_COLORS.BORDER_LIGHT,    // Light beige border
    text: BRAND_COLORS.TEXT,              // Primary text
    borderLeft: BRAND_COLORS.PRIMARY,     // Forest green accent
  },
  
  // Input combinations
  input: {
    background: BRAND_COLORS.SURFACE,
    border: BRAND_COLORS.BORDER_LIGHT,
    text: BRAND_COLORS.TEXT,
    placeholder: BRAND_COLORS.TEXT_SECONDARY,
  },
  
  // Status combinations
  success: {
    background: STATUS_COLORS.SUCCESS,
    text: '#FFFFFF',
  },
  warning: {
    background: STATUS_COLORS.WARNING,
    text: '#FFFFFF',
  },
  error: {
    background: STATUS_COLORS.ERROR,
    text: '#FFFFFF',
  },
  info: {
    background: STATUS_COLORS.INFO,
    text: '#FFFFFF',
  },
};

// Export default for backward compatibility
export default Colors;