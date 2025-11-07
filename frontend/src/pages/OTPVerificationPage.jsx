import React, { useState, useEffect } from 'react';
import { verifyOTP, sendOTP, signUp, createUserProfile } from '../utils/back4appApi';

const OTPVerificationPage = ({ onNavigate, onVerify, phone, email }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(120); // 2 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length - 1, 5);
    const lastInput = document.getElementById(`otp-${lastIndex}`);
    if (lastInput) lastInput.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP using REST API
      const result = await verifyOTP(phone, otpValue);

      if (result.success) {
        setSuccess('OTP verified successfully!');
        
        // Get registration data from session storage
        const registrationData = JSON.parse(sessionStorage.getItem('registrationData'));
        
        if (registrationData) {
          try {
            // Create new user using REST API
            const userData = await signUp(registrationData.phone, registrationData.email, registrationData.password);
            
            // Create user profile
            await createUserProfile(userData.objectId, {
              name: registrationData.fullName,
              phone: registrationData.phone,
              email: registrationData.email,
              isVerified: true
            }, userData.sessionToken);
            
            // Clear session storage
            sessionStorage.removeItem('registrationData');
            
            // Call the onVerify callback with user data
            onVerify({
              id: userData.objectId,
              name: registrationData.fullName,
              email: registrationData.email,
              phone: registrationData.phone,
              isVerified: true,
              sessionToken: userData.sessionToken
            });
            
          } catch (regError) {
            console.error('Registration completion error:', regError);
            setError('Registration failed: ' + regError.message);
          }
        } else {
          setError('Registration data not found. Please try registering again.');
        }
      } else {
        setError(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await sendOTP(phone, 'registration');

      if (result.success) {
        setTimer(120);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setSuccess('New OTP sent successfully!');
        
        // Show OTP in development mode
        if (result.otp) {
          alert(`Development Mode - Your new OTP is: ${result.otp}`);
        }
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
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
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter OTP</h2>
            <p className="text-gray-600">
              We've sent a 6-digit code to
            </p>
            <p className="font-semibold text-purple-600 mt-1">{phone}</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
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
                  Resend OTP
                </button>
              ) : (
                <p className="text-gray-600">
                  Resend OTP in <span className="font-semibold text-purple-600">{formatTime(timer)}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('register')}
              className="text-gray-500 hover:text-gray-700 text-sm"
              disabled={loading}
            >
              ← Change Phone Number
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Check your messages. The OTP should arrive within 30 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
