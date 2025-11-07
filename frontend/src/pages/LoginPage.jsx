import React, { useState } from 'react';
import { login, getUserProfile } from '../utils/back4appApi';

// Country codes for phone login
const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' }
];

// Rate limiting: max 5 failed attempts, then lockout for 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const LoginPage = ({ onNavigate, onLogin }) => {
  const [loginType, setLoginType] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    email: '',
    countryCode: '+91',
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);

  // Get login attempts from localStorage
  const getLoginAttempts = () => {
    const stored = localStorage.getItem('loginAttempts');
    if (!stored) return { count: 0, lockedUntil: null };
    return JSON.parse(stored);
  };

  // Update login attempts in localStorage
  const updateLoginAttempts = (increment = true) => {
    const current = getLoginAttempts();
    const now = Date.now();

    // Check if lockout period has expired
    if (current.lockedUntil && now > current.lockedUntil) {
      localStorage.setItem('loginAttempts', JSON.stringify({ count: increment ? 1 : 0, lockedUntil: null }));
      return;
    }

    // Increment or reset attempts
    const newCount = increment ? current.count + 1 : 0;
    const lockedUntil = newCount >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_DURATION : current.lockedUntil;

    localStorage.setItem('loginAttempts', JSON.stringify({
      count: newCount,
      lockedUntil
    }));
  };

  // Check if account is locked
  const checkAccountLock = () => {
    const attempts = getLoginAttempts();
    const now = Date.now();

    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      const minutesLeft = Math.ceil((attempts.lockedUntil - now) / 60000);
      setError(`Account temporarily locked. Try again in ${minutesLeft} minute(s).`);
      return true;
    }

    if (attempts.count >= MAX_LOGIN_ATTEMPTS - 2) {
      setWarning(`⚠️ ${MAX_LOGIN_ATTEMPTS - attempts.count} attempt(s) remaining before lockout.`);
    }

    return false;
  };

  // Validate password strength
  const validatePassword = (password) => {
    const issues = [];

    if (password.length < 6) {
      issues.push('Password must be at least 6 characters');
    }

    return issues;
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone format
  const validatePhone = (phone) => {
    // Basic validation - at least 7 digits
    const phoneRegex = /^\d{7,}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');

    // Check for account lockout
    if (checkAccountLock()) {
      return;
    }

    // Validate form
    if (!formData.password) {
      setError('Please enter your password');
      return;
    }

    if (loginType === 'email') {
      if (!formData.email) {
        setError('Please enter your email');
        return;
      }
      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }
    } else {
      if (!formData.phone) {
        setError('Please enter your phone number');
        return;
      }
      if (!validatePhone(formData.phone)) {
        setError('Please enter a valid phone number');
        return;
      }
    }

    // Validate password strength
    const passwordIssues = validatePassword(formData.password);
    if (passwordIssues.length > 0) {
      setError(passwordIssues[0]);
      return;
    }

    setLoading(true);

    try {
      // Prepare login credentials
      let username, passwordToUse;

      if (loginType === 'email') {
        username = formData.email.toLowerCase();
        passwordToUse = formData.password;
      } else {
        // For phone login, combine country code with phone
        const fullPhone = formData.countryCode + formData.phone;
        username = fullPhone;
        passwordToUse = formData.password;
      }

      // Attempt login via REST API
      const userData = await login(username, passwordToUse);

      if (userData && userData.sessionToken) {
        // Reset login attempts on success
        updateLoginAttempts(false);

        // Fetch user profile
        try {
          const profile = await getUserProfile(userData.objectId);

          // Call onLogin callback
          onLogin({
            id: userData.objectId,
            name: profile?.name || userData.username,
            email: userData.email,
            phone: userData.phone || userData.username,
            role: userData.role || 'user',
            isVerified: profile?.isVerified || false,
            sessionToken: userData.sessionToken
          });

          // Store session if remember me is checked
          if (rememberMe) {
            localStorage.setItem('userSession', JSON.stringify({
              id: userData.objectId,
              sessionToken: userData.sessionToken,
              timestamp: Date.now()
            }));
          }

          // Navigate to dashboard
          onNavigate('dashboard');
        } catch (profileError) {
          console.warn('Could not fetch profile, continuing with basic data:', profileError);
          onLogin({
            id: userData.objectId,
            name: userData.username,
            email: userData.email,
            phone: userData.phone || userData.username,
            role: userData.role || 'user',
            isVerified: false,
            sessionToken: userData.sessionToken
          });
          onNavigate('dashboard');
        }
      } else {
        setError('Login failed. Please check your credentials.');
        updateLoginAttempts(true);
      }
    } catch (err) {
      console.error('Login error:', err);

      // Specific error messages
      if (err.message.includes('Invalid username/password')) {
        setError('Invalid email/phone or password.');
      } else if (err.message.includes('User not found')) {
        setError('No account found with these credentials.');
      } else if (err.message.includes('Authentication failed')) {
        setError('Authentication failed. Please try again.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }

      updateLoginAttempts(true);
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
            <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-xl mb-8 opacity-90">
              Login to continue your journey to find your perfect life partner.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <span>Secure login with encryption</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <span>Verified profiles only</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌍</span>
                <span>Connect globally, find locally</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Login to Your Account</h2>
            <p className="text-gray-600">Enter your credentials to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-800 flex-1">{error}</p>
            </div>
          )}

          {warning && (
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <p className="text-yellow-800 flex-1">{warning}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Login Type Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Login Method</label>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLoginType('email')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                    loginType === 'email'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-transparent text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📧 Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('phone')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                    loginType === 'phone'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-transparent text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📱 Phone
                </button>
              </div>
            </div>

            {/* Email Input */}
            {loginType === 'email' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg transition-all"
                  disabled={loading}
                />
              </div>
            )}

            {/* Phone Input */}
            {loginType === 'phone' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="px-3 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white transition-all cursor-pointer"
                    style={{ minWidth: '120px' }}
                    disabled={loading}
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
                    maxLength="15"
                    className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg transition-all"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter valid phone number (7-15 digits)</p>
              </div>
            )}

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl hover:scale-110 transition-transform"
                  disabled={loading}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                  disabled={loading}
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-sm text-purple-600 font-semibold hover:underline disabled:opacity-50"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-purple-600 font-bold hover:underline disabled:opacity-50"
                disabled={loading}
              >
                Register Free
              </button>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('home')}
              className="text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50"
              disabled={loading}
            >
              ← Back to Home
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-xs text-blue-800">
              🔒 <strong>Security:</strong> We use encryption to protect your data. Never share your password with anyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
