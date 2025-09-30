import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '../../../components/HapticTab';
import { IconSymbol } from '../../../components/ui/IconSymbol';
import TabBarBackground from '../../../components/ui/TabBarBackground';
import { Colors } from '../../../constants/Colors';
import { useTheme } from '../../../contexts/ThemeContext';

export default function TabNavigationLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const getTabIcon = (name, focused, baseColor) => {
    // Colorful icons when active/focused for better UX
    const iconColors = {
      'house.fill': focused ? colors.accent.primary : colors.tabIconDefault,
      'exclamationmark.triangle.fill': focused ? colors.accent.warning : colors.tabIconDefault,
      'map.fill': focused ? colors.accent.secondary : colors.tabIconDefault,
      'doc.text.fill': focused ? colors.accent.success : colors.tabIconDefault,
      'person.fill': focused ? colors.accent.primary : colors.tabIconDefault,
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
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
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
          backgroundColor: colors.tabBackground,
          borderTopWidth: 1,
          borderTopColor: colors.border,
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