import React, { useState } from 'react';
import { Eye, EyeOff } from '@/components/shared/Icons';
import auth from '../../services/auth';
import { COLORS } from '../../constants/Colors';

const AureynxLogo = '/assets/Aureynx_Logo.webp';
const ElephantBackground = '/assets/ele_background.jpg';

const Login = ({ showPassword, setShowPassword, setCurrentScreen, onSuccessfulLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await auth.login({ email, password });
      onSuccessfulLogin();
    } catch (err) {
      setError(err.message || 'Login failed');
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '48px',
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
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: COLORS.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
              Sign In
            </button>
          </form>

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
            <button
              onClick={() => setCurrentScreen('forgot')}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.burntOrange,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              Forgot your password?
            </button>
            
            <div style={{ borderTop: `1px solid ${COLORS.borderLight}`, paddingTop: '20px' }}>
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