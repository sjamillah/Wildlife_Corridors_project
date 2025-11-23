import React, { useState } from 'react';
import auth from '../../services/auth';
import { COLORS } from '../../constants/Colors';

const AureynxLogo = '/assets/Aureynx_Logo.webp';
const ElephantBackground = '/assets/ele_background.jpg';

const Register = ({ showPassword, setShowPassword, setCurrentScreen, onSuccessfulRegister }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('ranger');
  const [error, setError] = useState(null);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await auth.sendRegistrationOTP({ 
        email, 
        name: `${firstName} ${lastName}`,
        role
      });
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
      await auth.verifyRegistrationOTP(email, otp);
      onSuccessfulRegister();
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
    }} className="md:flex-row">
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
        padding: '40px 24px',
        minHeight: '300px'
      }} className="md:min-h-screen md:p-16">
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
              Join the Conservation Movement
            </h1>
            <p style={{ 
              fontSize: '18px', 
              lineHeight: '1.7', 
              opacity: 0.95, 
              maxWidth: '520px',
              textAlign: 'left'
            }}>
              Be part of a global network dedicated to protecting wildlife corridors. Together, we're building a sustainable future for our planet's most vulnerable species.
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

      {/* Right Side - Register Form */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: COLORS.creamBg,
        padding: '20px',
        overflowY: 'auto',
      }} className="md:p-10">
        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: COLORS.whiteCard,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        }} className="md:p-12">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: COLORS.textPrimary, marginBottom: '8px', letterSpacing: '-0.5px' }} className="md:text-[28px]">
              Create Account
            </h2>
            <p style={{ fontSize: '14px', color: COLORS.textSecondary }} className="md:text-[15px]">
              Join the Aureynx Conservation Platform
            </p>
          </div>

          {!showOTP ? (
            /* Registration Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="md:grid-cols-2">
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
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
                  placeholder="First name"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                  placeholder="Last name"
                />
              </div>
            </div>

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

              <div style={{ position: 'relative', zIndex: 10 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
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
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 11,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = COLORS.forestGreen;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.forestGreen}15`;
                    e.currentTarget.style.zIndex = 12;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = COLORS.borderLight;
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.zIndex = 11;
                  }}
                >
                  <option value="ranger">Ranger</option>
                  <option value="conservation_manager">Conservation Manager</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                Organization
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
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
                placeholder="Wildlife organization"
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
                Verify & Create Account
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
                ← Back to Registration
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
            <div style={{ borderTop: `1px solid ${COLORS.borderLight}`, paddingTop: '20px' }}>
              <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>Already have an account? </span>
              <button
                onClick={() => setCurrentScreen('login')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.burntOrange,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;