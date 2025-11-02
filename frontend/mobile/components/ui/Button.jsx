import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, UI_COLORS, BRAND_COLORS } from '../../constants/Colors';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export function Button({ 
  children, 
  onPress, 
  variant = "primary", 
  size = "medium",
  style,
  fullWidth = false,
  disabled = false,
  ...props 
}) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [isPressed, setIsPressed] = useState(false);

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? UI_COLORS.BUTTON_DISABLED : BRAND_COLORS.ACCENT,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'warning':
        return {
          backgroundColor: disabled ? UI_COLORS.BUTTON_DISABLED : colors.accent.warning,
          borderWidth: 0,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? UI_COLORS.BUTTON_DISABLED : colors.accent.danger,
          borderWidth: 0,
        };
      case 'success':
        return {
          backgroundColor: disabled ? UI_COLORS.BUTTON_DISABLED : colors.accent.success,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: disabled ? '#94a3b8' : BRAND_COLORS.ACCENT,
          borderWidth: 0,
        };
    }
  };

  const getSizeStyle = () => {
    const baseSize = screenWidth < 768 ? 1 : 1.1; // Responsive sizing
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 12 * baseSize,
          paddingVertical: 8 * baseSize,
          minHeight: 36 * baseSize,
        };
      case 'medium':
        return {
          paddingHorizontal: 16 * baseSize,
          paddingVertical: 12 * baseSize,
          minHeight: 44 * baseSize,
        };
      case 'large':
        return {
          paddingHorizontal: 24 * baseSize,
          paddingVertical: 16 * baseSize,
          minHeight: 52 * baseSize,
        };
      default:
        return {
          paddingHorizontal: 16 * baseSize,
          paddingVertical: 12 * baseSize,
          minHeight: 44 * baseSize,
        };
    }
  };

  const getTextStyle = () => {
    const isSecondary = variant === 'secondary';
    return {
      color: disabled 
        ? colors.icon 
        : isSecondary 
          ? colors.text 
          : '#ffffff',
      fontSize: size === 'large' ? 16 : size === 'small' ? 14 : 15,
    };
  };

  const getPressedStyle = () => {
    if (!isPressed) return {};
    return {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    };
  };

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.button, 
        getVariantStyle(), 
        getSizeStyle(), 
        fullWidth && styles.fullWidth,
        getPressedStyle(),
        disabled && styles.disabled,
        style
      ]}
      disabled={disabled}
      {...props}
    >
      <Text style={[styles.text, getTextStyle()]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // Web-compatible shadow
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    // Mobile shadow fallback
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
});