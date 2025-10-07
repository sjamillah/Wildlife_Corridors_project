import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import auth from '../../services/auth';
import AureynxLogo from '../../assets/Aureynx_Logo.png';

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
    <div className="min-h-screen wildlife-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-warm rounded-2xl organic-shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={AureynxLogo} 
              alt="Aureynx Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Aureynx Wildlife Conservation Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-moss text-white py-3 px-6 rounded-xl font-medium transition duration-200"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            onClick={() => setCurrentScreen('forgot')}
            className="text-brand-primary hover:text-brand-earth text-sm font-medium"
          >
            Forgot your password?
          </button>
          
          <div className="border-t border-gray-200 pt-4">
            <span className="text-gray-600 text-sm">Don't have an account? </span>
            <button
              onClick={() => setCurrentScreen('register')}
              className="text-brand-primary hover:text-brand-earth font-medium text-sm"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;