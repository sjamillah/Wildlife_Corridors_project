import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BRAND_COLORS } from '@constants/Colors';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    try {
      this.setState({
        error,
        errorInfo,
      });
    } catch (setStateError) {
      console.error('Failed to set error state:', setStateError);
      // Don't crash even if setState fails
    }

    // You can also log the error to an error reporting service here
    // e.g., Sentry, Crashlytics, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>⚠️ Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. This has been logged.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_COLORS.TEXT,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  errorDetails: {
    backgroundColor: BRAND_COLORS.SURFACE,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
    maxHeight: 300,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: BRAND_COLORS.ACCENT,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  errorStack: {
    fontSize: 10,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;

