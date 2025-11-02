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
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BRAND_COLORS } from '../../../constants/Colors';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter email and password');
      return;
    }
    // Navigate to OTP verification
    router.push({
      pathname: '/screens/auth/OTPVerification',
      params: { method: 'email', contact: email }
    });
  };

  const navigateToSignUp = () => {
    router.push('/screens/auth/SignUpScreen');
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
          contentContainerStyle={styles.scrollContentSignIn}
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your mission</Text>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your.email@example.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <MaterialCommunityIcons name="eye-off" size={20} color="#6B7280" style={styles.eyeIcon} />
                    ) : (
                      <MaterialCommunityIcons name="eye" size={20} color="#6B7280" style={styles.eyeIcon} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => router.push('/screens/auth/ForgotPasswordScreen')}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleSignIn}
                activeOpacity={0.8}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={navigateToSignUp}>
                  <Text style={styles.signUpLink}>Register</Text>
                </TouchableOpacity>
              </View>

            {/* Footer */}
            <View style={styles.formFooter}>
              <Text style={styles.footerText}>Secure conservation management platform</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

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
  scrollContentSignIn: {
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
    minHeight: 500,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: BRAND_COLORS.TEXT,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 24,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
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
  eyeIcon: {
    padding: 5,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_MEDIUM,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.ACCENT,
    borderColor: BRAND_COLORS.ACCENT,
  },
  rememberMeText: {
    fontSize: 14,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  forgotPassword: {
    fontSize: 14,
    color: BRAND_COLORS.ACCENT,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: BRAND_COLORS.ACCENT,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  signUpLink: {
    fontSize: 16,
    color: BRAND_COLORS.ACCENT,
    fontWeight: '700',
  },
  formFooter: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
  },
  footerText: {
    fontSize: 12,
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '500',
  },
});

