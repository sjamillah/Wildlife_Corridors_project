// Primary brand color for mobile app
const tintColorLight = '#D76B27'; // brand-primary

// Color constants for easy reference
export const BRAND_COLORS = {
  PRIMARY: '#D76B27',
  SECONDARY: '#EECFAF',
  ACCENT: '#A7A87A',
  HIGHLIGHT: '#E67E22',
  TEXT: '#3A2E1E',
  TEXT_SECONDARY: '#6B5E52',
  BACKGROUND: '#FFF9F3',
  SURFACE: '#FFFFFF',
  BORDER: '#E5E7EB',
  MUTED: '#F9FAFB',
};

export const STATUS_COLORS = {
  SUCCESS: '#A7A87A', // Using brand accent color instead of green
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
};

export const DARK_MODE_COLORS = {
  PRIMARY: '#E67E22',
  SECONDARY: '#C3541A',
  ACCENT: '#FFB347',
  TEXT: '#FFF9F3',
  TEXT_SECONDARY: '#EECFAF',
  BACKGROUND: '#1A1A1A',
  SURFACE: '#D76B2726', // Orange with opacity
  BORDER: '#D76B2740',
  MUTED: '#D76B2715',
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
    
    // Brand palette
    brandPrimary: BRAND_COLORS.PRIMARY,
    brandSecondary: BRAND_COLORS.SECONDARY,
    brandAccent: BRAND_COLORS.ACCENT,
    brandHighlight: BRAND_COLORS.HIGHLIGHT,
    brandText: BRAND_COLORS.TEXT,
    brandTextSecondary: BRAND_COLORS.TEXT_SECONDARY,
    brandBg: BRAND_COLORS.BACKGROUND,
    brandSurface: BRAND_COLORS.SURFACE,
    brandBorder: BRAND_COLORS.BORDER,
    brandMuted: BRAND_COLORS.MUTED,
    
    // UI elements
    icon: BRAND_COLORS.TEXT_SECONDARY,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    tabBackground: BRAND_COLORS.SURFACE,
    border: BRAND_COLORS.BORDER,
    textSecondary: BRAND_COLORS.TEXT_SECONDARY,
    
    // Status colors
    accent: {
      primary: BRAND_COLORS.PRIMARY,
      secondary: BRAND_COLORS.SECONDARY,
      warning: STATUS_COLORS.WARNING,
      danger: STATUS_COLORS.ERROR,
      success: STATUS_COLORS.SUCCESS,
      info: STATUS_COLORS.INFO,
    }
  },
  dark: {
    // Dark mode colors
    text: DARK_MODE_COLORS.TEXT,
    background: '#1A1A1A', // Very dark background
    surface: 'rgba(215, 107, 39, 0.15)', // Orange with 15% opacity for cards
    cardBackground: 'rgba(215, 107, 39, 0.15)', // Orange with 15% opacity
    headerBackground: '#1A1A1A',
    tint: DARK_MODE_COLORS.PRIMARY,
    
    // Brand palette (dark mode variants)
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
    
    // UI elements
    icon: DARK_MODE_COLORS.TEXT_SECONDARY,
    tabIconDefault: '#6B7280',
    tabIconSelected: DARK_MODE_COLORS.PRIMARY,
    tabBackground: 'rgba(215, 107, 39, 0.1)',
    border: 'rgba(215, 107, 39, 0.25)',
    textSecondary: '#C4B5A8',
    
    // Status colors (adjusted for dark mode)
    accent: {
      primary: DARK_MODE_COLORS.PRIMARY,
      secondary: DARK_MODE_COLORS.SECONDARY,
      warning: STATUS_COLORS.WARNING,
      danger: STATUS_COLORS.ERROR,
      success: STATUS_COLORS.SUCCESS,
      info: STATUS_COLORS.INFO,
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
    background: BRAND_COLORS.PRIMARY,
    text: '#FFFFFF',
  },
  secondaryButton: {
    background: BRAND_COLORS.SECONDARY,
    text: BRAND_COLORS.TEXT,
  },
  
  // Card combinations
  card: {
    background: BRAND_COLORS.SURFACE,
    border: BRAND_COLORS.BORDER,
    text: BRAND_COLORS.TEXT,
  },
  
  // Input combinations
  input: {
    background: BRAND_COLORS.SURFACE,
    border: BRAND_COLORS.BORDER,
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