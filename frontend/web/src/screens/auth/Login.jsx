import React, { useState } from 'react';
import auth from '../../services/auth';
import { COLORS } from '../../constants/Colors';

const AureynxLogo = '/assets/Aureynx_Logo.webp';
const ElephantBackground = '/assets/ele_background.jpg';

const Login = ({ showPassword, setShowPassword, setCurrentScreen, onSuccessfulLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await auth.sendLoginOTP(email);
      setOtpMessage(response.message || 'OTP sent to your email');
      setShowOTP(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await auth.verifyLoginOTP(email, otp);
      onSuccessfulLogin();
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    }
  };

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
        {/* Overlay for better text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(46, 93, 69, 0.85) 0%, rgba(44, 36, 22, 0.75) 100%)',
        }}></div>

        {/* Content */}
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
              Aureynx Wildlife Conservation Platform
            </h1>
            <p style={{ 
              fontSize: '18px', 
              lineHeight: '1.7', 
              opacity: 0.95, 
              maxWidth: '520px',
              textAlign: 'left'
            }}>
              Protecting wildlife corridors through advanced tracking, monitoring, and conservation management. Join us in safeguarding the future of our planet's precious ecosystems.
            </p>
          </div>

          {/* Footer */}
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

      {/* Right Side - Login Form */}
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
          maxWidth: '480px',
          background: COLORS.whiteCard,
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '15px', color: COLORS.textSecondary }}>
              Sign in to continue to your conservation dashboard
            </p>
          </div>

          {!showOTP ? (
            /* Email Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    background: COLORS.whiteCard,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.forestGreen;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.forestGreen}15`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  background: COLORS.burntOrange,
                  border: 'none',
                  borderRadius: '8px',
                  color: COLORS.white,
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginTop: '8px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
              >
                Send Verification Code
              </button>
            </form>
          ) : (
            /* OTP Verification Form */
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ 
                padding: '12px', 
                background: '#F0F9FF', 
                color: COLORS.forestGreen, 
                borderRadius: '6px', 
                fontSize: '13px',
                marginBottom: '8px',
              }}>
                {otpMessage}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                  Verification Code (4 digits)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  maxLength={4}
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: '8px',
                    fontSize: '24px',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    background: COLORS.whiteCard,
                    outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.forestGreen;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.forestGreen}15`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  placeholder="0000"
                />
                <p style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '4px', textAlign: 'center' }}>
                  Check your email inbox for the OTP code
                </p>
              </div>

              <button
                type="submit"
                disabled={otp.length !== 4}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: otp.length === 4 ? COLORS.burntOrange : COLORS.borderLight,
                  border: 'none',
                  borderRadius: '8px',
                  color: COLORS.white,
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: otp.length === 4 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  marginTop: '8px',
                }}
                onMouseEnter={(e) => { 
                  if (otp.length === 4) e.currentTarget.style.background = COLORS.terracotta; 
                }}
                onMouseLeave={(e) => { 
                  if (otp.length === 4) e.currentTarget.style.background = COLORS.burntOrange; 
                }}
              >
                Verify & Sign In
              </button>

              <button
                type="button"
                onClick={() => setShowOTP(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '8px',
                  color: COLORS.textPrimary,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back to Login
              </button>
            </form>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            {error && (
              <div style={{ 
                padding: '12px', 
                background: '#FEF3F2', 
                color: COLORS.error, 
                borderRadius: '6px', 
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}
            <div style={{ borderTop: `1px solid ${COLORS.borderLight}`, paddingTop: '20px', marginTop: '20px' }}>
              <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>Don't have an account? </span>
              <button
                onClick={() => setCurrentScreen('register')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.burntOrange,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;