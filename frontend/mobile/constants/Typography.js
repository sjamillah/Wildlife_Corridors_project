import { Platform } from 'react-native';

/**
 * Typography System
 * Uses serif fonts across the entire app for a classic, professional look
 */

// Serif font stack for cross-platform consistency
export const FONT_FAMILY = {
  // Primary serif font
  REGULAR: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  BOLD: Platform.select({
    ios: 'Georgia-Bold',
    android: 'serif',
    default: 'Georgia-Bold',
  }),
  ITALIC: Platform.select({
    ios: 'Georgia-Italic',
    android: 'serif',
    default: 'Georgia-Italic',
  }),
  BOLD_ITALIC: Platform.select({
    ios: 'Georgia-BoldItalic',
    android: 'serif',
    default: 'Georgia-BoldItalic',
  }),
};

// Typography presets for consistent text styling
export const TYPOGRAPHY = {
  // Headings
  h1: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  h2: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  h3: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  h4: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  h5: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  h6: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  // Body text
  body: {
    fontFamily: FONT_FAMILY.REGULAR,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyBold: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  bodySmall: {
    fontFamily: FONT_FAMILY.REGULAR,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  bodySmallBold: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  // Captions and labels
  caption: {
    fontFamily: FONT_FAMILY.REGULAR,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  captionBold: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  label: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Special
  button: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  buttonSmall: {
    fontFamily: FONT_FAMILY.BOLD,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
};

// Helper function to get font family with weight
export const getFontFamily = (weight = '400') => {
  const weightNum = typeof weight === 'string' ? parseInt(weight) : weight;
  
  if (weightNum >= 700) {
    return FONT_FAMILY.BOLD;
  } else if (weightNum >= 500) {
    return FONT_FAMILY.BOLD;
  }
  return FONT_FAMILY.REGULAR;
};

export default {
  FONT_FAMILY,
  TYPOGRAPHY,
  getFontFamily,
};

