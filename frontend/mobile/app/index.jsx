import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

export default function AppEntryPoint() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const initializeApp = async () => {
      try {
        // Add any app initialization logic here
        // Check for stored auth tokens, load settings, etc.
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        
        // Navigate to appropriate screen
        router.replace('/screens/auth/SignInScreen');
      } catch (error) {
        console.error('App initialization failed:', error);
        // Handle initialization errors
        router.replace('/screens/auth/SignInScreen');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <ActivityIndicator 
          size="large" 
          color={colors.accent.primary} 
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});