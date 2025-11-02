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
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BRAND_COLORS } from '../../../constants/Colors';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const roles = [
    'Ranger',
    'Conservation Manager'
  ];

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }
    if (!role) {
      Alert.alert('Validation Error', 'Please select your role');
      return false;
    }
    return true;
  };

  const handleSignUp = () => {
    if (validateForm()) {
      // Navigate to OTP verification
      router.push({
        pathname: '/screens/auth/OTPVerification',
        params: { method: 'email', contact: email }
      });
    }
  };

  const navigateToSignIn = () => {
    router.push('/screens/auth/SignInScreen');
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the conservation team</Text>

              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
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
                  <MaterialCommunityIcons name="lock" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <MaterialCommunityIcons name="eye-off" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.eyeIcon} />
                    ) : (
                      <MaterialCommunityIcons name="eye" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.eyeIcon} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor={BRAND_COLORS.TEXT_SECONDARY}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <MaterialCommunityIcons name="eye-off" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.eyeIcon} />
                    ) : (
                      <MaterialCommunityIcons name="eye" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.eyeIcon} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Role */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Role</Text>
                <View style={styles.pickerWrapper}>
                  <MaterialCommunityIcons name="briefcase" size={20} color={BRAND_COLORS.TEXT_SECONDARY} style={styles.inputIcon} />
                  <Picker
                    selectedValue={role}
                    onValueChange={setRole}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select your role" value="" />
                    {roles.map((r) => (
                      <Picker.Item key={r} label={r} value={r} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
                activeOpacity={0.8}
              >
                <Text style={styles.signUpButtonText}>Create Account</Text>
              </TouchableOpacity>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToSignIn}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
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
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_MEDIUM,
    paddingHorizontal: 15,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  signUpButton: {
    backgroundColor: BRAND_COLORS.ACCENT,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signInText: {
    fontSize: 16,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  signInLink: {
    fontSize: 16,
    color: BRAND_COLORS.ACCENT,
    fontWeight: '700',
  },
});

