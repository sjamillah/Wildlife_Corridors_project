import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { BRAND_COLORS } from '@constants/Colors';
import { auth } from '@services';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return;
    }
    
    try {
      setLoading(true);
      const result = await auth.login(email);
      setOtpMessage(result.message || 'OTP sent to your email');
      setShowOTP(true);
      Alert.alert('Success', `Verification code sent to ${email}`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      Alert.alert('Validation Error', 'Please enter 4-digit OTP');
      return;
    }

    try {
      setLoading(true);
      console.log('Verifying OTP and logging in...');
      const result = await auth.verifyLoginOTP(email, otp);
      console.log('Login successful, navigating to dashboard...');
      
      // Small delay to ensure token is stored before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to main app tabs (DashboardScreen is the default)
      try {
        router.replace('/screens/(tabs)/DashboardScreen');
        console.log('Navigation initiated');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback: try push instead of replace
        router.push('/screens/(tabs)/DashboardScreen');
      }
    } catch (error) {
      console.error('Login verification error:', error);
      Alert.alert('Verification Failed', error.message || 'Invalid OTP');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={BRAND_COLORS.SURFACE} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo and Header */}
        <View style={styles.header}>
          <Image 
            source={require('../../../assets/images/Aureynx_Logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>
            {showOTP ? 'Verify Your Email' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {showOTP 
              ? `Enter the 4-digit code sent to ${email}` 
              : 'Sign in to continue to your conservation dashboard'
            }
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {!showOTP ? (
            /* Email Form */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={BRAND_COLORS.SURFACE} />
                ) : (
                  <Text style={styles.buttonText}>Send Verification Code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* OTP Form */
            <View style={styles.form}>
              <View style={styles.otpInfo}>
                <Text style={styles.otpInfoText}>{otpMessage}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code (4 digits)</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="0000"
                  placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                  editable={!loading}
                />
                <Text style={styles.helperText}>Check your email inbox for the code</Text>
              </View>

              <TouchableOpacity 
                style={[styles.button, (loading || otp.length !== 4) && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={loading || otp.length !== 4}
              >
                {loading ? (
                  <ActivityIndicator color={BRAND_COLORS.SURFACE} />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowOTP(false)}
              >
                <Text style={styles.backButtonText}>← Back to Email</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/screens/auth/SignUpScreen')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>© 2025 Aureynx. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.CREAM_BG,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: BRAND_COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_PRIMARY,
  },
  input: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
    color: BRAND_COLORS.TEXT_PRIMARY,
  },
  otpInput: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  helperText: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 4,
  },
  button: {
    backgroundColor: BRAND_COLORS.ACCENT,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: BRAND_COLORS.BORDER_LIGHT,
  },
  buttonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 15,
    fontWeight: '700',
  },
  otpInfo: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 6,
  },
  otpInfoText: {
    color: BRAND_COLORS.PRIMARY,
    fontSize: 13,
    textAlign: 'center',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    borderRadius: 8,
  },
  backButtonText: {
    color: BRAND_COLORS.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  footerText: {
    fontSize: 14,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  footerLink: {
    fontSize: 14,
    color: BRAND_COLORS.ACCENT,
    fontWeight: '700',
  },
  copyright: {
    fontSize: 13,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.8,
  },
});
