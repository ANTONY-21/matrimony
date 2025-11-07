import React, { useState } from 'react';
import { checkEmailExists, checkPhoneExists, sendOTP } from '../utils/back4appApi';

// Country codes for phone number dropdown
const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' }
];

const RegisterPage = ({ onNavigate, onRegister }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    countryCode: '+91',
    phone: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if email or phone already exists
  const checkDuplicate = async (email, phone) => {
    try {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        return { exists: true, type: 'email' };
      }
      
      const phoneExists = await checkPhoneExists(phone);
      if (phoneExists) {
        return { exists: true, type: 'phone' };
      }
      
      return { exists: false };
    } catch (error) {
      console.error('Duplicate check error:', error);
      return { exists: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate all fields
    if (!formData.fullName || !formData.phone || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Validate phone number
    if (formData.countryCode === '+91' && formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = formData.countryCode + formData.phone;
      
      // Check duplicates
      const duplicate = await checkDuplicate(formData.email, fullPhone);
      
      if (duplicate.exists) {
        setLoading(false);
        if (duplicate.type === 'email') {
          setError(
            <span>
              This email is already registered.{' '}
              <button 
                onClick={() => onNavigate('login')} 
                className="underline font-bold"
              >
                Please login
              </button>
              {' '}or use{' '}
              <button 
                onClick={() => onNavigate('forgot-password')} 
                className="underline font-bold"
              >
                forgot password
              </button>
            </span>
          );
        } else {
          setError(
            <span>
              This phone number is already registered.{' '}
              <button 
                onClick={() => onNavigate('login')} 
                className="underline font-bold"
              >
                Please login
              </button>
              {' '}or use{' '}
              <button 
                onClick={() => onNavigate('forgot-password')} 
                className="underline font-bold"
              >
                forgot password
              </button>
            </span>
          );
        }
        return;
      }

      // Send OTP
      const result = await sendOTP(fullPhone, 'registration');

      if (result.success) {
        // Store registration data
        sessionStorage.setItem('registrationData', JSON.stringify({
          fullName: formData.fullName,
          phone: fullPhone,
          email: formData.email.toLowerCase(),
          password: formData.password
        }));
        
        // Show OTP in development
        if (result.otp) {
          alert(`Development Mode - Your OTP is: ${result.otp}`);
        }
        
        // Navigate to OTP page
        onNavigate('otp-verification', { 
          phone: fullPhone, 
          email: formData.email 
        });
      } else {
        setError(result.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Panel */}
        <div className="hidden lg:block">
          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-3xl p-12 text-white shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-5xl">❤️</span>
              <h1 className="text-4xl font-bold">MatrimonyAI</h1>
            </div>
            <h2 className="text-3xl font-bold mb-4">Start Your Journey Today!</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of happy couples who found their perfect match.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">1</div>
                <span className="font-semibold">Create Account</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">2</div>
                <span className="font-semibold">Verify Phone</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">3</div>
                <span className="font-semibold">Start Matching</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-gray-600">Fill in your details to get started</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-800 flex-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
              <div className="flex gap-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="px-3 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white transition-all cursor-pointer"
                  style={{ minWidth: '110px' }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, phone: value });
                  }}
                  placeholder="98765 43210"
                  maxLength={formData.countryCode === '+91' ? '10' : '15'}
                  className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.countryCode === '+91' ? 'Enter 10-digit mobile number' : 'Enter valid phone number'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button onClick={() => onNavigate('login')} className="text-purple-600 font-bold hover:underline">
                Login
              </button>
            </p>
          </div>

          <div className="mt-6 text-center">
            <button onClick={() => onNavigate('home')} className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
