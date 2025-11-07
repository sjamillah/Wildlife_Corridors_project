import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

const TOKEN_KEY = 'authToken'; // Must match auth.js

export default function AppEntryPoint() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication and navigate accordingly
    const initializeApp = async () => {
      try {
        // Check for stored auth token
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        
        if (token) {
          // User is already logged in, go to tabs (DashboardScreen is the default)
          router.replace('/screens/(tabs)/DashboardScreen');
        } else {
          // User not logged in, go to sign in
          router.replace('/screens/auth/SignInScreen');
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        // On error, go to sign in
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