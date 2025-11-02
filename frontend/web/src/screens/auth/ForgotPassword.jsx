import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from '@/components/shared/Icons';
import { COLORS } from '../../constants/Colors';

const ElephantBackground = '/assets/ele_background.jpg';

const ForgotPassword = ({ setCurrentScreen }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending reset email
    setIsSubmitted(true);
  };

  if (isSubmitted) {
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
          opacity: 0.8,
          fontSize: '13px',
          marginTop: 'auto',
          paddingBottom: '0',
          textAlign: 'left',
        }}>
          © 2025 Aureynx. All rights reserved.
        </div>
        </div>

        {/* Right Side - Success Message */}
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
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: COLORS.success,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <CheckCircle className="w-8 h-8" style={{ color: COLORS.white }} />
            </div>
            
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, marginBottom: '16px', letterSpacing: '-0.5px' }}>
              Check Your Email
            </h1>
            
            <p style={{ fontSize: '15px', color: COLORS.textSecondary, marginBottom: '24px', lineHeight: '1.6' }}>
              We've sent a password reset link to <strong style={{ color: COLORS.textPrimary }}>{email}</strong>
            </p>
            
            <p style={{ fontSize: '13px', color: COLORS.textSecondary, marginBottom: '32px' }}>
              Didn't receive the email? Check your spam folder or try again.
            </p>
            
            <button
              onClick={() => setCurrentScreen('login')}
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
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <div style={{ position: 'relative', zIndex: 1, color: COLORS.white, opacity: 0.8, fontSize: '13px', marginTop: 'auto', paddingBottom: '20px' }}>
          © 2025 Aureynx. All rights reserved.
        </div>
      </div>

      {/* Right Side - Reset Form */}
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
            <div style={{
              width: '64px',
              height: '64px',
              background: COLORS.burntOrange,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Mail className="w-8 h-8" style={{ color: COLORS.white }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: COLORS.textPrimary, marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Reset Password
            </h1>
            <p style={{ fontSize: '15px', color: COLORS.textSecondary }}>
              Enter your email to receive reset instructions
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              Send Reset Instructions
            </button>
          </form>

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

export default ForgotPassword;