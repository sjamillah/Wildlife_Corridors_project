import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { UI_COLORS } from '../../constants/Colors';

/**
 * Centralized Icon Component for Wildlife Corridors App
 * 
 * Supports multiple icon libraries:
 * - MaterialCommunityIcons (default, most comprehensive)
 * - MaterialIcons
 * - FontAwesome5
 * - Ionicons
 * - Feather
 * 
 * Usage:
 * <Icon name="elephant" size={24} color="#000" />
 * <Icon name="alert-circle" library="MaterialCommunityIcons" size={24} />
 */

const Icon = ({ 
  name, 
  size = 24, 
  color = '#000', 
  library = 'MaterialCommunityIcons',
  style,
  ...props 
}) => {
  // Select the appropriate icon library
  const getIconComponent = () => {
    switch (library) {
      case 'MaterialIcons':
        return MaterialIcons;
      case 'FontAwesome5':
        return FontAwesome5;
      case 'Ionicons':
        return Ionicons;
      case 'Feather':
        return Feather;
      case 'MaterialCommunityIcons':
      default:
        return MaterialCommunityIcons;
    }
  };

  const IconComponent = getIconComponent();

  return (
    <IconComponent 
      name={name} 
      size={size} 
      color={color} 
      style={style}
      {...props}
    />
  );
};

export default Icon;

/**
 * Icon with background container
 * Useful for creating circular or rounded icon buttons
 */
export const IconWithBackground = ({ 
  name, 
  size = 24, 
  color = UI_COLORS.ICON_DEFAULT, 
  backgroundColor = UI_COLORS.ICON_BG,
  library = 'MaterialCommunityIcons',
  containerSize = 40,
  borderRadius = 20,
  style,
  containerStyle,
  ...props 
}) => {
  return (
    <View style={[
      styles.iconContainer,
      {
        width: containerSize,
        height: containerSize,
        borderRadius: borderRadius,
        backgroundColor: backgroundColor
      },
      containerStyle
    ]}>
      <Icon 
        name={name} 
        size={size} 
        color={color} 
        library={library}
        style={style}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

