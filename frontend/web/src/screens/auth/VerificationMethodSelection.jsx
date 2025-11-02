import React, { useState } from 'react';
import { Mail, Smartphone, ArrowLeft } from '@/components/shared/Icons';
import { COLORS } from '../../constants/Colors';

const AureynxLogo = '/assets/Aureynx_Logo.webp';
const ElephantBackground = '/assets/ele_background.jpg';

const VerificationMethodSelection = ({ setCurrentScreen, userEmail, userPhone }) => {
  const [selectedMethod, setSelectedMethod] = useState('email');
  const [customContact, setCustomContact] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const contact = selectedMethod === 'email' 
      ? (customContact || userEmail)
      : (customContact || userPhone);

    if (!contact) {
      setError('Please enter your contact information');
      return;
    }

    // Validate format
    if (selectedMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      setError('Please enter a valid email address');
      return;
    }

    if (selectedMethod === 'phone' && !/^\+?[\d\s-]{10,}$/.test(contact)) {
      setError('Please enter a valid phone number');
      return;
    }

    // Send OTP and move to verification screen
    console.log(`Sending OTP to ${selectedMethod}: ${contact}`);
    setCurrentScreen('otp-verification', { method: selectedMethod, contact });
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
              Verify Your Identity
            </h1>
            <p style={{
              fontSize: '18px',
              lineHeight: '1.7',
              opacity: 0.95,
              maxWidth: '520px',
              textAlign: 'left'
            }}>
              Choose how you'd like to receive your verification code. We take security seriously to protect our wildlife conservation data.
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

      {/* Right Side - Method Selection Form */}
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
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Verification Method
            </h1>
            <p style={{ fontSize: '15px', color: COLORS.textSecondary }}>
              How would you like to receive your code?
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Method Selection Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
              {/* Email Option */}
              <div
                onClick={() => setSelectedMethod('email')}
                style={{
                  padding: '16px',
                  border: `2px solid ${selectedMethod === 'email' ? COLORS.forestGreen : COLORS.borderLight}`,
                  borderRadius: '12px',
                  background: selectedMethod === 'email' ? `${COLORS.forestGreen}08` : COLORS.whiteCard,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: selectedMethod === 'email' ? COLORS.forestGreen : COLORS.secondaryBg,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Mail className="w-5 h-5" style={{ color: selectedMethod === 'email' ? COLORS.white : COLORS.textSecondary }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '2px' }}>
                    Email Address
                  </div>
                  <div style={{ fontSize: '13px', color: COLORS.textSecondary }}>
                    Receive code via email
                  </div>
                </div>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedMethod === 'email' ? COLORS.forestGreen : COLORS.borderMedium}`,
                  background: selectedMethod === 'email' ? COLORS.forestGreen : COLORS.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selectedMethod === 'email' && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.white }}></div>
                  )}
                </div>
              </div>

              {/* Phone Option */}
              <div
                onClick={() => setSelectedMethod('phone')}
                style={{
                  padding: '16px',
                  border: `2px solid ${selectedMethod === 'phone' ? COLORS.forestGreen : COLORS.borderLight}`,
                  borderRadius: '12px',
                  background: selectedMethod === 'phone' ? `${COLORS.forestGreen}08` : COLORS.whiteCard,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: selectedMethod === 'phone' ? COLORS.forestGreen : COLORS.secondaryBg,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Smartphone className="w-5 h-5" style={{ color: selectedMethod === 'phone' ? COLORS.white : COLORS.textSecondary }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '2px' }}>
                    Phone Number
                  </div>
                  <div style={{ fontSize: '13px', color: COLORS.textSecondary }}>
                    Receive code via SMS
                  </div>
                </div>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${selectedMethod === 'phone' ? COLORS.forestGreen : COLORS.borderMedium}`,
                  background: selectedMethod === 'phone' ? COLORS.forestGreen : COLORS.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selectedMethod === 'phone' && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.white }}></div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Input */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                {selectedMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                type={selectedMethod === 'email' ? 'email' : 'tel'}
                required
                value={customContact}
                onChange={(e) => {
                  setCustomContact(e.target.value);
                  setError('');
                }}
                placeholder={selectedMethod === 'email' ? 'your.email@example.com' : '+254 700 000 000'}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${error ? COLORS.error : COLORS.borderLight}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  background: COLORS.whiteCard,
                  outline: 'none',
                  transition: 'all 0.2s ease',
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
              {error && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: COLORS.error, fontWeight: 500 }}>
                  {error}
                </div>
              )}
            </div>

            {/* Submit Button */}
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

          {/* Back Button */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
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

export default VerificationMethodSelection;

