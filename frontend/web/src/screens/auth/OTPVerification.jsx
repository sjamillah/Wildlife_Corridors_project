import React, { useState, useEffect } from 'react';
import { Mail, Smartphone, ArrowLeft, Shield } from '@/components/shared/Icons';
import { COLORS } from '../../constants/Colors';

const AureynxLogo = '/assets/Aureynx_Logo.webp';
const ElephantBackground = '/assets/ele_background.jpg';

const OTPVerification = ({ setCurrentScreen, verificationMethod = 'email', contactInfo = '' }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    const lastInput = document.getElementById(`otp-${lastIndex}`);
    if (lastInput) lastInput.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      // On success, redirect to dashboard or next step
      // navigate('/dashboard');
      console.log('OTP verified:', otpValue);
    }, 1500);
  };

  const handleResend = () => {
    if (!canResend) return;
    
    setOtp(['', '', '', '', '', '']);
    setTimer(60);
    setCanResend(false);
    setError('');
    
    // Simulate sending OTP
    console.log(`Resending OTP to ${contactInfo}`);
  };

  const maskedContact = verificationMethod === 'email' 
    ? contactInfo.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : contactInfo.replace(/(\d{3})(\d{4})(\d{3})/, '$1****$3');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Left Side - Image with Content */}
      <div style={{
        flex: '0 0 60%',
        backgroundImage: `url(${ElephantBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 48px',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(46, 93, 69, 0.85) 0%, rgba(44, 36, 22, 0.75) 100%)',
        }}></div>

        <div style={{
          position: 'relative',
          zIndex: 1,
          color: COLORS.white,
          paddingTop: '60px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          <div>
            <img
              src={AureynxLogo}
              alt="Aureynx Logo"
              style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '48px' }}
            />
            <h1 style={{
              fontSize: '42px',
              fontWeight: 800,
              lineHeight: '1.2',
              marginBottom: '24px',
              letterSpacing: '-1px',
              maxWidth: '520px',
              textAlign: 'left'
            }}>
              Secure Access Verification
            </h1>
            <p style={{
              fontSize: '18px',
              lineHeight: '1.7',
              opacity: 0.95,
              maxWidth: '520px',
              textAlign: 'left'
            }}>
              We've sent a verification code to protect your account. This extra layer of security ensures only authorized personnel can access the conservation platform.
            </p>
          </div>

          <div style={{
            marginTop: 'auto',
            paddingBottom: '0',
          }}>
            <div style={{ color: COLORS.white, opacity: 0.8, fontSize: '13px', textAlign: 'left' }}>
              © 2025 Aureynx. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - OTP Form */}
      <div style={{
        flex: '0 0 40%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLORS.creamBg,
        padding: '40px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: COLORS.whiteCard,
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        }}>
          {/* Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            background: COLORS.forestGreen,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Shield className="w-8 h-8" style={{ color: COLORS.white }} />
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Enter Verification Code
            </h1>
            <p style={{ fontSize: '14px', color: COLORS.textSecondary, lineHeight: '1.6', marginBottom: '8px' }}>
              We sent a 6-digit code to
            </p>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '6px 12px',
              background: COLORS.secondaryBg,
              borderRadius: '6px'
            }}>
              {verificationMethod === 'email' ? (
                <Mail className="w-4 h-4" style={{ color: COLORS.forestGreen }} />
              ) : (
                <Smartphone className="w-4 h-4" style={{ color: COLORS.forestGreen }} />
              )}
              <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                {maskedContact}
              </span>
            </div>
          </div>

          {/* OTP Input */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'center', 
              marginBottom: '24px' 
            }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  style={{
                    width: '48px',
                    height: '56px',
                    fontSize: '24px',
                    fontWeight: 700,
                    textAlign: 'center',
                    border: `2px solid ${error ? COLORS.error : COLORS.borderLight}`,
                    borderRadius: '8px',
                    background: COLORS.whiteCard,
                    color: COLORS.textPrimary,
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = error ? COLORS.error : COLORS.forestGreen;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? COLORS.error : COLORS.forestGreen}15`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = error ? COLORS.error : COLORS.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '12px',
                background: COLORS.tintCritical,
                border: `1px solid ${COLORS.error}`,
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '13px', color: COLORS.error, fontWeight: 500 }}>
                  {error}
                </span>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isVerifying || otp.join('').length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                background: isVerifying || otp.join('').length !== 6 ? COLORS.borderMedium : COLORS.forestGreen,
                border: 'none',
                borderRadius: '8px',
                color: COLORS.white,
                fontSize: '15px',
                fontWeight: 700,
                cursor: isVerifying || otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isVerifying || otp.join('').length !== 6 ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!(isVerifying || otp.join('').length !== 6)) {
                  e.currentTarget.style.background = '#245739';
                }
              }}
              onMouseLeave={(e) => {
                if (!(isVerifying || otp.join('').length !== 6)) {
                  e.currentTarget.style.background = COLORS.forestGreen;
                }
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          {/* Resend Section */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '12px' }}>
              Didn't receive the code?
            </p>
            {canResend ? (
              <button
                onClick={handleResend}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.burntOrange,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.terracotta; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.burntOrange; }}
              >
                Resend Code
              </button>
            ) : (
              <span style={{ fontSize: '14px', color: COLORS.textSecondary, fontWeight: 600 }}>
                Resend in {timer}s
              </span>
            )}
          </div>

          {/* Back Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setCurrentScreen('login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                color: COLORS.textSecondary,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                gap: '8px',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;

