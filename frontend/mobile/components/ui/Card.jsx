import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export function Card({ children, style, variant = 'flat', padding = 'default' }) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          elevation: 8,
          shadowOpacity: 0.15,
          shadowRadius: 8,
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        };
      case 'subtle':
        return {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        };
      default:
        return {};
    }
  };

  const getPaddingStyle = () => {
    const basePadding = screenWidth < 768 ? 16 : 20; // Responsive padding
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: basePadding * 0.75 };
      case 'large':
        return { padding: basePadding * 1.5 };
      default:
        return { padding: basePadding };
    }
  };

  return (
    <View style={[
      styles.card, 
      { backgroundColor: colors.cardBackground || colors.surface },
      getVariantStyle(),
      getPaddingStyle(),
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    // Mobile shadow fallback (kept minimal by default)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});