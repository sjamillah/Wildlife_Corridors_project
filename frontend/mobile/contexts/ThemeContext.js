import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({
  colorScheme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useRNColorScheme();
  const [colorScheme, setColorScheme] = useState('light');
  const [manualOverride, setManualOverride] = useState(null);

  // Load saved theme preference on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme) {
          setManualOverride(savedTheme);
          setColorScheme(savedTheme);
        } else {
          setColorScheme(systemColorScheme || 'light');
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
        setColorScheme(systemColorScheme || 'light');
      }
    };
    loadThemePreference();
  }, [systemColorScheme]);

  // Update theme when system theme changes (if no manual override)
  useEffect(() => {
    if (!manualOverride) {
      setColorScheme(systemColorScheme || 'light');
    }
  }, [systemColorScheme, manualOverride]);



  const saveThemePreference = async (theme) => {
    try {
      await AsyncStorage.setItem('themePreference', theme);
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = colorScheme === 'light' ? 'dark' : 'light';
    setColorScheme(newTheme);
    setManualOverride(newTheme);
    saveThemePreference(newTheme);
  };

  const setTheme = (theme) => {
    setColorScheme(theme);
    setManualOverride(theme);
    saveThemePreference(theme);
  };

  const resetToSystemTheme = () => {
    setManualOverride(null);
    setColorScheme(systemColorScheme || 'light');
    AsyncStorage.removeItem('themePreference');
  };

  const value = {
    theme: colorScheme,
    colorScheme,
    isDark: colorScheme === 'dark',
    toggleTheme,
    setTheme,
    resetToSystemTheme,
    isSystemTheme: !manualOverride,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Backward compatibility hook
export const useColorScheme = () => {
  const { colorScheme } = useTheme();
  return colorScheme;
};