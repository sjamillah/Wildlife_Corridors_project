import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@components/HapticTab';
import { IconSymbol } from '@components/ui/IconSymbol';
import TabBarBackground from '@components/ui/TabBarBackground';
import { Colors } from '@constants/Colors';
import { useTheme } from '@contexts/ThemeContext';

export default function TabNavigationLayout() {
  const { theme } = useTheme();
  // Ensure theme is valid and colors exist, fallback to light theme
  const themeKey = theme === 'dark' ? 'dark' : 'light';
  const colors = Colors[themeKey] || Colors.light;

  // Safety check - if colors is still undefined, provide defaults
  if (!colors || !colors.tint) {
    console.warn('Colors not properly initialized, using defaults');
  }

  const getTabIcon = (name, focused, baseColor) => {
    // Colorful icons when active/focused for better UX
    // Use safe access with fallbacks
    const accent = colors?.accent || Colors.light.accent;
    const tabIconDefault = colors?.tabIconDefault || Colors.light.tabIconDefault;
    
    const iconColors = {
      'house.fill': focused ? (accent?.primary || Colors.light.tint) : tabIconDefault,
      'exclamationmark.triangle.fill': focused ? (accent?.warning || '#F59E0B') : tabIconDefault,
      'map.fill': focused ? (accent?.secondary || Colors.light.tint) : tabIconDefault,
      'doc.text.fill': focused ? (accent?.success || '#10B981') : tabIconDefault,
      'person.fill': focused ? (accent?.primary || Colors.light.tint) : tabIconDefault,
    };

    return (
      <IconSymbol 
        size={26} 
        name={name} 
        color={iconColors[name] || baseColor} 
      />
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors?.tint || Colors.light.tint,
        tabBarInactiveTintColor: colors?.tabIconDefault || Colors.light.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginBottom: 2,
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 34 : 8,
          backgroundColor: colors?.tabBackground || Colors.light.tabBackground,
          borderTopWidth: 1,
          borderTopColor: colors?.border || Colors.light.border,
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {
              elevation: 8,
            },
          }),
        },
      }}>
      <Tabs.Screen
        name="DashboardScreen"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => getTabIcon('house.fill', focused, color),
        }}
      />
      <Tabs.Screen
        name="FieldDataScreen"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => getTabIcon('doc.text.fill', focused, color),
        }}
      />
      <Tabs.Screen
        name="MapScreen"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => getTabIcon('map.fill', focused, color),
        }}
      />
      <Tabs.Screen
        name="AlertsScreen"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => getTabIcon('exclamationmark.triangle.fill', focused, color),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => getTabIcon('person.fill', focused, color),
        }}
      />
    </Tabs>
  );
}