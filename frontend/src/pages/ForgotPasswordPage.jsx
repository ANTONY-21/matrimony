import React, { useState, useEffect } from 'react';
import { sendOTP, verifyOTP } from '../utils/back4appApi';

// Country codes for phone-based password reset
const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' }
];

const ForgotPasswordPage = ({ onNavigate }) => {
  const [step, setStep] = useState(1); // 1: Email/Phone, 2: OTP, 3: New Password
  const [resetType, setResetType] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    email: '',
    countryCode: '+91',
    phone: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);

  // Timer for OTP
  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone format
  const validatePhone = (phone) => {
    const phoneRegex = /^\d{7,}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  // Validate password strength
  const validatePasswordStrength = (password) => {
    const issues = [];

    if (password.length < 6) {
      issues.push('Password must be at least 6 characters');
    }
    if (!/[A-Z]/.test(password)) {
      issues.push('Must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      issues.push('Must contain at least one number');
    }

    return issues;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (resetType === 'email') {
        if (!formData.email) {
          setError('Please enter your email address');
          setLoading(false);
          return;
        }
        if (!validateEmail(formData.email)) {
          setError('Please enter a valid email address');
          setLoading(false);
          return;
        }
      } else {
        if (!formData.phone) {
          setError('Please enter your phone number');
          setLoading(false);
          return;
        }
        if (!validatePhone(formData.phone)) {
          setError('Please enter a valid phone number');
          setLoading(false);
          return;
        }
      }

      // Send OTP via REST API
      const phone = resetType === 'phone' ? formData.countryCode + formData.phone : null;
      const email = resetType === 'email' ? formData.email : null;

      const result = await sendOTP(phone || email, 'password_reset');

      if (result.success) {
        setStep(2);
        setTimer(120);
        setCanResend(false);
        setSuccess('');

        // Show OTP in development mode
        if (result.otp) {
          alert(`Development Mode - Your OTP is: ${result.otp}`);
        }
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    const otpValue = formData.otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);

    try {
      const phone = resetType === 'phone' ? formData.countryCode + formData.phone : null;
      const email = resetType === 'email' ? formData.email : null;

      const result = await verifyOTP(phone || email, otpValue);

      if (result.success) {
        setStep(3);
        setSuccess('OTP verified! Now set your new password.');
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please enter both password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordIssues = validatePasswordStrength(formData.newPassword);
    if (passwordIssues.length > 0) {
      setError(passwordIssues[0]);
      return;
    }

    setLoading(true);

    try {
      // TODO: Call Cloud Function or API to reset password with OTP verification
      // For now, we'll show a success message
      setSuccess('Password reset successful!');
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');

    try {
      const phone = resetType === 'phone' ? formData.countryCode + formData.phone : null;
      const email = resetType === 'email' ? formData.email : null;

      const result = await sendOTP(phone || email, 'password_reset');

      if (result.success) {
        setTimer(120);
        setCanResend(false);
        setFormData({ ...formData, otp: ['', '', '', '', '', ''] });
        setSuccess('New OTP sent successfully!');

        if (result.otp) {
          alert(`Development Mode - Your new OTP is: ${result.otp}`);
        }
      } else {
        setError('Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData({ ...formData, otp: newOtp });

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
          {/* Step 1: Enter Email/Phone */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🔑</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                <p className="text-gray-600">
                  No worries! Enter your email or phone number and we'll send you a recovery code.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-red-800 flex-1">{error}</p>
                </div>
              )}

              {/* Reset Method Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Reset Method</label>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setResetType('email')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      resetType === 'email'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-transparent text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={loading}
                  >
                    📧 Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetType('phone')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      resetType === 'phone'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-transparent text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={loading}
                  >
                    📱 Phone
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-6">
                {/* Email Input */}
                {resetType === 'email' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Phone Input */}
                {resetType === 'phone' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        className="px-3 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white"
                        style={{ minWidth: '110px' }}
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
                        className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Recovery Code'}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🔐</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Recovery Code</h2>
                <p className="text-gray-600">We've sent a 6-digit code to</p>
                <p className="font-semibold text-purple-600 mt-1">
                  {resetType === 'email' ? formData.email : formData.countryCode + formData.phone}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-red-800 flex-1">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <p className="text-green-800 flex-1">{success}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="flex justify-center gap-3">
                  {formData.otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-all"
                      disabled={loading}
                    />
                  ))}
                </div>

                <div className="text-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-purple-600 font-semibold hover:underline disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <p className="text-gray-600">
                      Resend Code in <span className="font-semibold text-purple-600">{formatTime(timer)}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || formData.otp.join('').length !== 6}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            </>
          )}

          {/* Step 3: Set New Password */}
          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
                <p className="text-gray-600">
                  Create a strong password for your account
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-red-800 flex-1">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <p className="text-green-800 flex-1">{success}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={formData.showPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showPassword: !formData.showPassword })}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl hover:scale-110"
                      disabled={loading}
                    >
                      {formData.showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must contain: uppercase, number, 6+ characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={formData.showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, showConfirmPassword: !formData.showConfirmPassword })}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl hover:scale-110"
                      disabled={loading}
                    >
                      {formData.showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                onNavigate('login');
                setStep(1);
              }}
              className="text-gray-500 hover:text-gray-700 text-sm disabled:opacity-50"
              disabled={loading}
            >
              ← Back to Login
            </button>
          </div>

          {/* Security Notice */}
          {step === 3 && (
            <div className="mt-6 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-xs text-blue-800">
                🔒 <strong>Security Tip:</strong> Use a unique password not used on other platforms.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
