import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../contexts/ThemeContext';

// Professional background for tab bar that adapts to theme
export default function TabBarBackground() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  return (
    <View 
      style={[
        StyleSheet.absoluteFill, 
        { backgroundColor: colors.tabBackground }
      ]} 
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}