/**
 * Professional Wildlife Corridors color scheme with proper light/dark backgrounds
 */

const tintColorLight = '#16a34a'; // Forest green - professional and nature-focused
const tintColorDark = '#22c55e'; // Lighter green for dark mode

export const Colors = {
  light: {
    // Using your original colors
    text: '#111827', // Your original primary text color
    background: '#F9FAFB', // Your original light background
    surface: '#ffffff', // Your original white surfaces
    tint: tintColorLight,
    icon: '#6B7280', // Your original icon color
    tabIconDefault: '#9CA3AF', // Your original inactive tab color
    tabIconSelected: tintColorLight, // Active forest green
    tabBackground: '#ffffff', // White tab bar background
    border: '#E5E7EB', // Your original border color
    cardBackground: '#ffffff', // Your original white cards
    headerBackground: '#ffffff', // White header
    textSecondary: '#6B7280', // Your original secondary text
    accent: {
      primary: '#16a34a', // Forest green
      secondary: '#0369a1', // Sky blue for secondary actions
      warning: '#f97316', // Your original warning color
      danger: '#ef4444', // Your original danger color
      success: '#059669', // Your original success color
    }
  },
  dark: {
    // Dark theme that complements your light colors
    text: '#F9FAFB', // Light text on dark background
    background: '#111827', // Dark background (inverted from your light text)
    surface: '#1F2937', // Slightly lighter dark surface for cards
    tint: tintColorDark,
    icon: '#9CA3AF', // Light gray icons
    tabIconDefault: '#6B7280', // Darker inactive tabs in dark mode
    tabIconSelected: tintColorDark, // Light green for active tabs
    tabBackground: '#1F2937', // Dark tab bar
    border: '#374151', // Visible dark borders
    cardBackground: '#1F2937', // Dark cards with subtle difference from background
    headerBackground: '#1F2937', // Dark header
    textSecondary: '#9CA3AF', // Light gray for secondary text
    accent: {
      primary: '#22c55e', // Lighter green for dark mode visibility
      secondary: '#3B82F6', // Brighter blue for dark mode
      warning: '#FBBF24', // Lighter amber for dark mode
      danger: '#F87171', // Lighter red for dark mode
      success: '#10B981', // Lighter emerald for dark mode
    }
  },
};