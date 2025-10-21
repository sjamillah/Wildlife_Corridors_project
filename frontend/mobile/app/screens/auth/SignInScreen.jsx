import React, { useState, useEffect } from 'react';
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
import * as LocalAuthentication from 'expo-local-authentication';
import { BRAND_COLORS } from '../../../constants/Colors';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState(null);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setBiometricSupported(compatible && enrolled);
      setBiometricType(types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ? 'face' : 
                      types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) ? 'fingerprint' : 
                      'biometric');
    } catch (error) {
      console.log('Biometric check failed:', error);
    }
  };

  const handleSignIn = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter email and password');
      return;
    }
    // TODO: Implement actual authentication
    router.push('/screens/(tabs)/DashboardScreen');
  };

  const handleBiometricSignIn = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in to Aureynx Wildlife Corridors',
        subPromptMessage: 'Use your biometric to access your account',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });

      if (result.success) {
        // In a real app, you'd get the stored credentials here
        // For now, we'll just navigate to dashboard
        router.push('/screens/(tabs)/DashboardScreen');
      } else {
        Alert.alert('Authentication Failed', 'Biometric authentication was cancelled or failed');
      }
    } catch (_error) {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const navigateToSignUp = () => {
    router.push('/screens/auth/SignUpScreen');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.3)" translucent />
      
      <View style={styles.backgroundContainer}>
        <View style={styles.overlay} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContentSignIn}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerSignIn}>
              <Image 
                source={require('../../../assets/images/Aureynx_Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>Aureynx</Text>
              <Text style={styles.tagline}>Wildlife Conservation Platform</Text>
            </View>

            {/* Form Card */}
            <View style={[styles.formCard, { backgroundColor: BRAND_COLORS.BACKGROUND }]}>
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
                
                <TouchableOpacity>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.signInButton, { backgroundColor: BRAND_COLORS.PRIMARY }]}
                onPress={handleSignIn}
                activeOpacity={0.8}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>

              {biometricSupported && (
                <>
                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Biometric Sign In */}
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricSignIn}
                    activeOpacity={0.8}
                  >
                    {biometricType === 'face' ? (
                      <MaterialCommunityIcons name="face-recognition" size={20} color={BRAND_COLORS.PRIMARY} />
                    ) : biometricType === 'fingerprint' ? (
                      <MaterialCommunityIcons name="fingerprint" size={20} color={BRAND_COLORS.PRIMARY} />
                    ) : (
                      <MaterialCommunityIcons name="cellphone-key" size={20} color={BRAND_COLORS.PRIMARY} />
                    )}
                    <Text style={styles.biometricButtonText}>
                      Sign In with {biometricType === 'face' ? 'Face ID' : biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometrics'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={navigateToSignUp}>
                  <Text style={styles.signUpLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#f7efe6',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContentSignIn: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerSignIn: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(244, 243, 236, 1)',
    borderRadius: 20,
    padding: 30,
    elevation: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1F2937',
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
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderColor: BRAND_COLORS.PRIMARY,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  forgotPassword: {
    fontSize: 14,
    color: BRAND_COLORS.PRIMARY,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 0,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: BRAND_COLORS.PRIMARY,
    marginBottom: 20,
  },
  biometricButtonText: {
    color: BRAND_COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 16,
    color: BRAND_COLORS.PRIMARY,
    fontWeight: '600',
  },
});

