import React from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import AureynxLogo from '../assets/Aureynx_Logo.webp';

const Login = ({ showPassword, setShowPassword, setCurrentScreen, onSuccessfulLogin }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd validate credentials here
    if (onSuccessfulLogin) {
      onSuccessfulLogin();
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-brand-primary/10 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={AureynxLogo} 
              alt="Aureynx Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aureynx</h1>
          <p className="text-gray-600">Aureynx Wildlife Conservation Platform</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="manager@aurenyx.org"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-secondary" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => setCurrentScreen('forgot')}
                className="text-sm text-brand-primary hover:text-brand-secondary"
              >
                Forgot password?
              </button>
            </div>
            
            <button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account? 
          <button 
            onClick={() => setCurrentScreen('register')} 
            className="text-brand-primary hover:text-brand-secondary font-semibold ml-1"
          >
            Register
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Secure conservation management platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
