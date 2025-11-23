import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@constants/Colors';
import { useTheme } from '@contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export function Card({ children, style, variant = 'flat', padding = 'default' }) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          elevation: 8,
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: colors.border,
          elevation: 0,
        };
      case 'subtle':
        return {
          backgroundColor: colors.surface,
          elevation: 0,
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
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)', // Very subtle border
  },
});