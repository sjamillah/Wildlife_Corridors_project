import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Badge({ 
  children, 
  variant = "default", 
  style 
}) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'success':
        return { container: styles.successBadge, text: styles.successText };
      case 'warning':
        return { container: styles.warningBadge, text: styles.warningText };
      case 'danger':
        return { container: styles.dangerBadge, text: styles.dangerText };
      case 'info':
        return { container: styles.infoBadge, text: styles.infoText };
      case 'purple':
        return { container: styles.purpleBadge, text: styles.purpleText };
      default:
        return { container: styles.defaultBadge, text: styles.defaultText };
    }
  };

  const variantStyles = getVariantStyle();

  return (
    <View style={[styles.badge, variantStyles.container, style]}>
      <Text style={[styles.text, variantStyles.text]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Default
  defaultBadge: {
    backgroundColor: '#f3f4f6',
  },
  defaultText: {
    color: '#374151',
  },
  // Success
  successBadge: {
    backgroundColor: '#dcfce7',
  },
  successText: {
    color: '#166534',
  },
  // Warning
  warningBadge: {
    backgroundColor: '#fef3c7',
  },
  warningText: {
    color: '#92400e',
  },
  // Danger
  dangerBadge: {
    backgroundColor: '#fecaca',
  },
  dangerText: {
    color: '#991b1b',
  },
  // Info
  infoBadge: {
    backgroundColor: '#dbeafe',
  },
  infoText: {
    color: '#1e40af',
  },
  // Purple
  purpleBadge: {
    backgroundColor: '#e9d5ff',
  },
  purpleText: {
    color: '#7c2d12',
  },
});