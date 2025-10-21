# Wildlife Corridors Mobile App - Color System

This directory contains the centralized color system for the Wildlife Corridors mobile application, designed to match the web application's brand palette.

## 📁 Files Overview

- **`Colors.js`** - Main color constants and theme definitions
- **`ColorUtils.js`** - Utility functions for color manipulation and access
- **`AppConfig.js`** - Application configuration using color constants
- **`AppConfigGenerator.js`** - Generator for app.json configuration
- **`index.js`** - Centralized exports for easy importing

## 🎨 Color Palette

### Brand Colors

```javascript
BRAND_COLORS = {
  PRIMARY: "#D76B27", // Warm orange
  SECONDARY: "#EECFAF", // Cream
  ACCENT: "#A7A87A", // Sage green
  HIGHLIGHT: "#E67E22", // Bright orange
  TEXT: "#3A2E1E", // Dark brown
  TEXT_SECONDARY: "#6B5E52", // Medium brown
  BACKGROUND: "#FFF9F3", // Warm white
  SURFACE: "#FFFFFF", // Pure white
  BORDER: "#E5E7EB", // Light gray
  MUTED: "#F9FAFB", // Very light gray
};
```

### Status Colors

```javascript
STATUS_COLORS = {
  SUCCESS: "#10B981", // Green
  WARNING: "#F59E0B", // Amber
  ERROR: "#EF4444", // Red
  INFO: "#3B82F6", // Blue
};
```

## 🚀 Usage Examples

### Basic Import

```javascript
import { BRAND_COLORS, STATUS_COLORS } from "../constants/Colors";
```

### Using Color Constants

```javascript
// Instead of hardcoded colors
backgroundColor: "#D76B27";

// Use constants
backgroundColor: BRAND_COLORS.PRIMARY;
```

### Theme-Aware Colors

```javascript
import { Colors, useThemeColor } from "../constants/Colors";

// In your component
const backgroundColor = useThemeColor({}, "background");
const textColor = useThemeColor({}, "text");
```

### Utility Functions

```javascript
import {
  getBrandColor,
  getStatusColor,
  createBrandStyles,
} from "../constants/ColorUtils";

// Get brand color by name
const primaryColor = getBrandColor("primary", "light");

// Get status color
const successColor = getStatusColor("success", "light");

// Create complete style object
const styles = createBrandStyles("light");
```

### Common Color Combinations

```javascript
import { COMMON_COLORS } from "../constants/ColorUtils";

// Button styles
const primaryButtonStyle = {
  backgroundColor: COMMON_COLORS.primaryButton.background,
  color: COMMON_COLORS.primaryButton.text,
};

// Card styles
const cardStyle = {
  backgroundColor: COMMON_COLORS.card.background,
  borderColor: COMMON_COLORS.card.border,
};
```

## 🔧 Migration Guide

### Before (Hardcoded Colors)

```javascript
const styles = StyleSheet.create({
  button: {
    backgroundColor: "#D76B27",
    borderRadius: 8,
  },
  text: {
    color: "#3A2E1E",
  },
});
```

### After (Using Constants)

```javascript
import { BRAND_COLORS } from "../constants/Colors";

const styles = StyleSheet.create({
  button: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: 8,
  },
  text: {
    color: BRAND_COLORS.TEXT,
  },
});
```

## 🌙 Dark Mode Support

The color system automatically handles dark mode with appropriate color variants:

```javascript
import { Colors } from "../constants/Colors";

// Light mode
const lightColor = Colors.light.brandPrimary; // '#D76B27'

// Dark mode
const darkColor = Colors.dark.brandPrimary; // '#E67E22'
```

## 📱 Component Integration

### Button Component Example

```javascript
import { BRAND_COLORS, COMMON_COLORS } from "../constants/Colors";

const PrimaryButton = ({ title, onPress }) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: BRAND_COLORS.PRIMARY }]}
    onPress={onPress}
  >
    <Text
      style={[styles.buttonText, { color: COMMON_COLORS.primaryButton.text }]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);
```

### Card Component Example

```javascript
import { BRAND_COLORS, COMMON_COLORS } from "../constants/Colors";

const Card = ({ children }) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: BRAND_COLORS.SURFACE,
        borderColor: BRAND_COLORS.BORDER,
      },
    ]}
  >
    {children}
  </View>
);
```

## 🎯 Best Practices

1. **Always use constants** - Never hardcode color values
2. **Import what you need** - Use specific imports for better tree-shaking
3. **Use theme-aware functions** - Leverage `useThemeColor` for dynamic theming
4. **Consistent naming** - Follow the established naming conventions
5. **Test both themes** - Ensure colors work in both light and dark modes

## 🔄 Updating Colors

To update colors across the entire app:

1. Update the color value in `Colors.js`
2. The change will automatically propagate to all components
3. Test in both light and dark modes
4. Update documentation if needed

## 📚 Additional Resources

- [React Native Styling Guide](https://reactnative.dev/docs/style)
- [Expo Color Schemes](https://docs.expo.dev/guides/color-schemes/)
- [Accessibility Color Guidelines](https://webaim.org/articles/contrast/)

---

**Note**: This color system is designed to match the web application's brand palette for a consistent user experience across platforms.
