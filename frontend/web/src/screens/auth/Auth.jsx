import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import VerificationMethodSelection from './VerificationMethodSelection';
import OTPVerification from './OTPVerification';
import auth from '../../services/auth';

const Auth = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationData, setVerificationData] = useState({ method: 'email', contact: '' });
  const navigate = useNavigate();

  // Check if user is already logged in on mount
  useEffect(() => {
    if (auth.isAuthenticated()) {
      console.log('User already logged in, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSuccessfulLogin = (token) => {
    // auth.register/login already stores token in localStorage
    if (auth.isAuthenticated()) {
      navigate('/dashboard');
    }
  };

  const handleScreenChange = (screen, data = {}) => {
    setCurrentScreen(screen);
    if (data.method || data.contact) {
      setVerificationData(data);
    }
  };

  return (
    <div className="font-sans">
      {currentScreen === 'login' && (
        <Login 
          showPassword={showPassword} 
          setShowPassword={setShowPassword} 
          setCurrentScreen={handleScreenChange}
          onSuccessfulLogin={handleSuccessfulLogin}
        />
      )}
      {currentScreen === 'register' && (
        <Register 
          showPassword={showPassword} 
          setShowPassword={setShowPassword} 
          setCurrentScreen={handleScreenChange}
          onSuccessfulRegister={handleSuccessfulLogin}
        />
      )}
      {currentScreen === 'forgot' && (
        <ForgotPassword 
          setCurrentScreen={handleScreenChange} 
        />
      )}
      {currentScreen === 'verification-method' && (
        <VerificationMethodSelection 
          setCurrentScreen={handleScreenChange}
          userEmail="user@example.com"
          userPhone="+254 700 000 000"
        />
      )}
      {currentScreen === 'otp-verification' && (
        <OTPVerification 
          setCurrentScreen={handleScreenChange}
          verificationMethod={verificationData.method}
          contactInfo={verificationData.contact}
        />
      )}
    </div>
  );
};

export default Auth;
