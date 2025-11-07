import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/useColorScheme';
import { ThemeProvider as AppThemeProvider } from '../contexts/ThemeContext';
import { AlertsProvider } from '../contexts/AlertsContext';

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
  );
}