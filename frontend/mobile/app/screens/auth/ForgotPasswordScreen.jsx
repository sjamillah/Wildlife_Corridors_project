import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate sending reset email
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Reset Link Sent', 
        `We've sent a password reset link to ${email}`,
        [
          { text: 'OK', onPress: () => router.push('/screens/auth/SignInScreen') }
        ]
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND_COLORS.BACKGROUND} />
      
      {/* Background Image */}
      <Image 
        source={require('../../../assets/images/ele_background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section on Background */}
          <View style={styles.heroSection}>
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Image 
                source={require('../../../assets/images/Aureynx_Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>Aureynx</Text>
              <Text style={styles.tagline}>Wildlife Conservation Platform</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={BRAND_COLORS.SURFACE} />
              ) : (
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* Back to Sign In */}
            <View style={styles.backContainer}>
              <Text style={styles.backText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.push('/screens/auth/SignInScreen')}>
                <Text style={styles.backLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.formFooter}>
              <Text style={styles.footerText}>
                Check your spam folder if you don't receive the email within a few minutes
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(46, 93, 69, 0.7)',
  },
  heroContent: {
    zIndex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND_COLORS.SURFACE,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 32,
    paddingTop: 40,
    minHeight: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND_COLORS.TEXT,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_MEDIUM,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: BRAND_COLORS.TEXT,
  },
  submitButton: {
    backgroundColor: BRAND_COLORS.ACCENT,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: BRAND_COLORS.BORDER_MEDIUM,
    opacity: 0.6,
  },
  submitButtonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  backLink: {
    fontSize: 14,
    color: BRAND_COLORS.ACCENT,
    fontWeight: '700',
  },
  formFooter: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  footerText: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
});

