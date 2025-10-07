import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import auth from '../../services/auth';

const Auth = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSuccessfulLogin = (token) => {
    // auth.register/login already stores token in localStorage
    if (auth.isAuthenticated()) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="font-sans">
      {currentScreen === 'login' && (
        <Login 
          showPassword={showPassword} 
          setShowPassword={setShowPassword} 
          setCurrentScreen={setCurrentScreen}
          onSuccessfulLogin={handleSuccessfulLogin}
        />
      )}
      {currentScreen === 'register' && (
        <Register 
          showPassword={showPassword} 
          setShowPassword={setShowPassword} 
          setCurrentScreen={setCurrentScreen}
          onSuccessfulRegister={handleSuccessfulLogin}
        />
      )}
      {currentScreen === 'forgot' && (
        <ForgotPassword 
          setCurrentScreen={setCurrentScreen} 
        />
      )}
    </div>
  );
};

export default Auth;
