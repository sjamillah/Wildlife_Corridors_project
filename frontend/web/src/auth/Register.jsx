import React from 'react';
import { Mail, Lock, Eye, EyeOff, User, Shield, ArrowRight } from 'lucide-react';

const Register = ({ showPassword, setShowPassword, setCurrentScreen, onSuccessfulRegister }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd validate and submit registration data here
    if (onSuccessfulRegister) {
      onSuccessfulRegister();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-brand-primary/10 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the conservation team</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="manager@ecowatch.org"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent">
                <option>Conservation Manager</option>
                <option>Field Ranger</option>
                <option>Data Analyst</option>
                <option>Research Coordinator</option>
                <option>Wildlife Veterinarian</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
              <input
                type="text"
                placeholder="Your conservation organization"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
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
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters with numbers and symbols</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-start">
              <input type="checkbox" className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-secondary mt-1" />
              <span className="ml-2 text-sm text-gray-600">
                I agree to the <button type="button" className="text-brand-primary hover:text-brand-primary underline">Terms of Service</button> and <button type="button" className="text-brand-primary hover:text-brand-primary underline">Privacy Policy</button>
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <span>Create Account</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account? 
          <button 
            onClick={() => setCurrentScreen('login')} 
            className="text-brand-primary hover:text-brand-primary font-semibold ml-1"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
