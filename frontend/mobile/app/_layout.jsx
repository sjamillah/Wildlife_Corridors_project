import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, Platform } from 'react-native';
import 'react-native-reanimated';
import { useEffect } from 'react';

// Using react-native-maps with OpenStreetMap (default provider) - no API keys needed

import { useColorScheme } from '@hooks/useColorScheme';
import { ThemeProvider as AppThemeProvider } from '@contexts/ThemeContext';
import { AlertsProvider } from '@contexts/AlertsContext';
import ErrorBoundary from '@components/ErrorBoundary';

// Global error handlers to prevent app crashes
if (typeof global !== 'undefined') {
  // Handle unhandled promise rejections
  const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
  
  global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    console.error('🚨 Global error handler caught error:', error, 'isFatal:', isFatal);
    
    // Log the error but don't crash the app
    if (error && error.message) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Only call original handler for non-fatal errors or if it's a critical system error
    // For most errors, we'll just log and continue
    if (isFatal && originalHandler) {
      // Only crash for truly fatal system errors
      try {
        originalHandler(error, isFatal);
      } catch (handlerError) {
        console.error('Error in original handler:', handlerError);
        // Don't crash even if handler fails
      }
    } else {
      // Non-fatal error - just log it
      console.warn('Non-fatal error caught, app will continue:', error.message);
    }
  });

  // Handle unhandled promise rejections - prevent crashes
  if (typeof Promise !== 'undefined') {
    // Wrap Promise.reject to catch unhandled rejections
    const originalReject = Promise.reject;
    Promise.reject = function(reason) {
      console.error('⚠️ Unhandled promise rejection caught:', reason);
      // Log but don't crash
      if (reason && reason.message) {
        console.error('Rejection message:', reason.message);
        console.error('Rejection stack:', reason.stack);
      }
      // Still reject, but we've logged it
      return originalReject.call(this, reason);
    };
  }
}

// Set up unhandled promise rejection handler (React Native compatible)
// In React Native, window might not exist or might not have addEventListener
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('⚠️ Window: Unhandled promise rejection:', event.reason);
    // Prevent default to avoid crashing
    if (event.preventDefault) {
      event.preventDefault();
    }
    // Mark as handled so it doesn't crash
    event.stopPropagation();
  }, true); // Use capture phase
}

// Apply Inter-like font globally (same as web)
// Using native system fonts that closely match Inter's clean sans-serif style
const appFont = Platform.select({ 
  ios: '-apple-system',  // San Francisco - Apple's system font
  android: 'Roboto',      // Android's default, similar to Inter
  default: 'system-ui'
});
if (!Text.defaultProps) Text.defaultProps = {};
if (!TextInput.defaultProps) TextInput.defaultProps = {};
Text.defaultProps.style = { fontFamily: appFont };
TextInput.defaultProps.style = { fontFamily: appFont };

export default function RootNavigationLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ErrorBoundary>
    <AppThemeProvider>
      <AlertsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="screens/auth/SignInScreen" options={{ headerShown: false }} />
            <Stack.Screen name="screens/auth/SignUpScreen" options={{ headerShown: false }} />
            <Stack.Screen name="screens/(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="screens/patrol/ReportEmergencyScreen" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AlertsProvider>
    </AppThemeProvider>
    </ErrorBoundary>
  );
}