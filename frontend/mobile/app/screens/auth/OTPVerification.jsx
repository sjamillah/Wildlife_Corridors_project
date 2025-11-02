import React, { useState, useEffect, useRef } from 'react';
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

export default function OTPVerificationScreen({ route }) {
  const verificationMethod = route?.params?.method || 'email';
  const contactInfo = route?.params?.contact || 'user@example.com';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, key) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Simulate verification
    setTimeout(() => {
      setIsVerifying(false);
      Alert.alert('Success', 'Verification successful!', [
        { text: 'OK', onPress: () => router.push('/screens/(tabs)/DashboardScreen') }
      ]);
    }, 1500);
  };

  const handleResend = () => {
    if (!canResend) return;
    
    setOtp(['', '', '', '', '', '']);
    setTimer(60);
    setCanResend(false);
    setError('');
    
    Alert.alert('Code Sent', `A new verification code has been sent to ${maskedContact}`);
  };

  const maskedContact = verificationMethod === 'email' 
    ? contactInfo.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : contactInfo.replace(/(\d{3})(\d{4})(\d{3})/, '$1****$3');

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
              <Text style={styles.appName}>Secure Access</Text>
              <Text style={styles.tagline}>Verification Required</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to</Text>
            
            <View style={styles.contactBadge}>
              <MaterialCommunityIcons 
                name={verificationMethod === 'email' ? 'email' : 'cellphone'} 
                size={16} 
                color={BRAND_COLORS.PRIMARY} 
              />
              <Text style={styles.contactText}>{maskedContact}</Text>
            </View>

            {/* OTP Input Boxes */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => inputRefs.current[index] = ref}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(index, key)}
                  maxLength={1}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  style={[
                    styles.otpInput,
                    error && styles.otpInputError,
                    digit && styles.otpInputFilled
                  ]}
                />
              ))}
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color={STATUS_COLORS.ERROR} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isVerifying || otp.join('').length !== 6}
              style={[
                styles.verifyButton,
                (isVerifying || otp.join('').length !== 6) && styles.verifyButtonDisabled
              ]}
            >
              {isVerifying ? (
                <ActivityIndicator color={BRAND_COLORS.SURFACE} />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendLink}>Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>Resend in {timer}s</Text>
              )}
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Check your email for the verification code
            </Text>
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
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  contactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND_COLORS.MUTED,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 32,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.SURFACE,
    color: BRAND_COLORS.TEXT,
  },
  otpInputFilled: {
    borderColor: BRAND_COLORS.PRIMARY,
  },
  otpInputError: {
    borderColor: STATUS_COLORS.ERROR,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: STATUS_COLORS.ERROR + '15',
    borderWidth: 1,
    borderColor: STATUS_COLORS.ERROR,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: STATUS_COLORS.ERROR,
    flex: 1,
  },
  verifyButton: {
    backgroundColor: BRAND_COLORS.ACCENT,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: BRAND_COLORS.BORDER_MEDIUM,
    opacity: 0.6,
  },
  verifyButtonText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 15,
    fontWeight: '700',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendPrompt: {
    fontSize: 13,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 12,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.ACCENT,
    textDecorationLine: 'underline',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

