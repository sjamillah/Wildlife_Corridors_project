import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND_COLORS } from '@constants/Colors';

const TOKEN_KEY = 'authToken'; // Must match auth.js

export default function AppEntryPoint() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let timeoutId = null;
    let mounted = true;

    // Check authentication and navigate accordingly
    const initializeApp = async () => {
      // Set a timeout to prevent app from hanging indefinitely
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('App initialization timeout - navigating to sign in');
          setIsLoading(false);
          router.replace('/screens/auth/SignInScreen');
        }
      }, 5000); // 5 second timeout

      try {
        // Check for stored auth token with timeout
        const tokenPromise = AsyncStorage.getItem(TOKEN_KEY);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AsyncStorage timeout')), 3000)
        );
        
        const token = await Promise.race([tokenPromise, timeoutPromise]).catch(() => null);
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (!mounted) return;
        
        if (token) {
          // User is already logged in, go to tabs (DashboardScreen is the default)
          router.replace('/screens/(tabs)/DashboardScreen');
        } else {
          // User not logged in, go to sign in
          router.replace('/screens/auth/SignInScreen');
        }
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        console.error('App initialization failed:', error);
        // On error, go to sign in
        if (mounted) {
          router.replace('/screens/auth/SignInScreen');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: BRAND_COLORS.BACKGROUND }]}>
        <StatusBar style="auto" />
        <ActivityIndicator 
          size="large" 
          color={BRAND_COLORS.PRIMARY} 
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