import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';

/**
 * Main Application Component
 * Handles routing and authentication state
 */
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageData, setPageData] = useState(null); // For passing data between pages
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('matrimony_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setCurrentPage('dashboard');
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('matrimony_user');
      }
    }
  }, []);

  // Navigation handler with optional data
  const handleNavigate = (page, data = null) => {
    setCurrentPage(page);
    setPageData(data);
    window.scrollTo(0, 0);
  };

  // OTP Verification handler - completes registration
  const handleOTPVerify = async () => {
    try {
      const registrationData = JSON.parse(sessionStorage.getItem('registrationData'));
      
      if (!registrationData) {
        alert('Registration data not found. Please register again.');
        handleNavigate('register');
        return;
      }

      const Parse = window.Parse;
      
      // Create new user
      const user = new Parse.User();
      user.set('username', registrationData.phone); // Use phone as username
      user.set('email', registrationData.email);
      user.set('password', registrationData.password);
      
      await user.signUp();
      
      // Create user profile
      const UserProfile = Parse.Object.extend('UserProfile');
      const profile = new UserProfile();
      profile.set('userId', user);
      profile.set('fullName', registrationData.fullName);
      profile.set('phone', registrationData.phone);
      profile.set('email', registrationData.email);
      profile.set('isVerified', true); // OTP verified
      profile.set('createdAt', new Date());
      
      await profile.save();
      
      // Clear session storage
      sessionStorage.removeItem('registrationData');
      
      // Log the user in
      handleLogin({
        id: user.id,
        name: registrationData.fullName,
        email: registrationData.email,
        phone: registrationData.phone,
        role: 'user',
        isVerified: true
      });
      
    } catch (error) {
      console.error('Registration completion error:', error);
      alert('Registration failed: ' + error.message);
      handleNavigate('register');
    }
  };

  // Login handler
  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('matrimony_user', JSON.stringify(user));
    // Redirect to admin if user role is admin
    const destination = user.role === 'admin' ? 'admin' : 'dashboard';
    handleNavigate(destination);
  };

  // Register handler - now just navigates to OTP page
  const handleRegister = (user) => {
    // This is called after OTP verification in the new flow
    handleLogin(user);
  };

  // Logout handler
  const handleLogout = () => {
    const Parse = window.Parse;
    Parse.User.logOut().then(() => {
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('matrimony_user');
      handleNavigate('home');
    });
  };

  // Admin access check
  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };

  // Protected route wrapper
  const renderProtectedPage = (page) => {
    if (!isAuthenticated) {
      return <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />;
    }
    return page;
  };

  // Admin route wrapper
  const renderAdminPage = (page) => {
    if (!isAuthenticated || !isAdmin()) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-xl shadow-2xl p-12 text-center max-w-md">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You don't have permission to access the admin panel.</p>
            <button
              onClick={() => handleNavigate('dashboard')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return page;
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      
      case 'login':
        return <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />;
      
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} onRegister={handleRegister} />;
      
      case 'otp-verification':
        return (
          <OTPVerificationPage 
            onNavigate={handleNavigate} 
            onVerify={handleOTPVerify}
            phone={pageData?.phone || ''}
            email={pageData?.email || ''}
          />
        );
      
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
      
      case 'dashboard':
        return renderProtectedPage(
          <DashboardPage 
            currentUser={currentUser} 
            onNavigate={handleNavigate} 
            onLogout={handleLogout} 
          />
        );
      
      case 'admin':
        return renderAdminPage(
          <AdminDashboard 
            currentUser={currentUser} 
            onNavigate={handleNavigate} 
            onLogout={handleLogout} 
          />
        );

      case 'admin-users':
        return renderAdminPage(
          <AdminUsers 
            onNavigate={handleNavigate} 
            onLogout={handleLogout} 
          />
        );
      
      // Protected pages - require authentication
      case 'ai-chat':
      case 'discover':
      case 'my-profile':
      case 'my-interest':
      case 'messaging':
      case 'profile-viewers':
      case 'gallery':
      case 'packages':
      case 'settings':
        return renderProtectedPage(
          <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-8">
            <div className="bg-white rounded-xl shadow-2xl p-12 text-center max-w-md">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {currentPage.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </h2>
              <p className="text-gray-600 mb-6">This page is under development</p>
              <button
                onClick={() => handleNavigate('dashboard')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        );
      
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app">
      {renderPage()}
    </div>
  );
};

export default App;
