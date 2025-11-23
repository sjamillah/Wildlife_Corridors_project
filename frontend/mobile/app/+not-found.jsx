import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@constants/Colors';
import { useTheme } from '@contexts/ThemeContext';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const handleGoHome = () => {
    router.replace('/screens/auth/SignInScreen');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.content}>
        <Text style={[styles.errorCode, { color: colors.accent.primary }]}>404</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Wildlife Corridor Not Found
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          The page you are looking for has wandered off the beaten path.
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.accent.primary }]}
          onPress={handleGoHome}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            Return to Safety
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 400,
  },
  errorCode: {
    fontSize: 120,
    fontWeight: 'bold',
    marginBottom: 20,
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});