# 🔒 SECURITY & QUALITY ASSURANCE GUIDE
## Matrimony AI Platform - Development Standards

---

## 📋 TABLE OF CONTENTS
1. [Security Checklist](#security-checklist)
2. [Code Quality Standards](#code-quality-standards)
3. [Bug Prevention Strategies](#bug-prevention-strategies)
4. [Testing Requirements](#testing-requirements)
5. [Common Vulnerabilities & Fixes](#common-vulnerabilities--fixes)
6. [Best Practices](#best-practices)
7. [Code Review Checklist](#code-review-checklist)

---

## 🔐 SECURITY CHECKLIST

### 1. Authentication & Authorization

#### ✅ Must Implement:
```javascript
// ❌ BAD - No validation
const login = async (email, password) => {
  const user = await Parse.User.logIn(email, password);
  return user;
};

// ✅ GOOD - With validation and error handling
const login = async (email, password) => {
  try {
    // Input validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Password strength check
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    // Attempt login with rate limiting
    const user = await Parse.User.logIn(email.toLowerCase(), password);
    
    // Log successful login
    await trackActivity(user.id, 'login', { ipAddress: getClientIP() });
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.get('email'),
        sessionToken: user.getSessionToken()
      }
    };
  } catch (error) {
    // Log failed attempt
    await logFailedLogin(email, error.message);
    throw error;
  }
};
```

#### 🔒 Security Rules:
- **Never store passwords in plain text**
- **Always use HTTPS**
- **Implement session timeout (30 minutes)**
- **Use JWT tokens with expiration**
- **Hash sensitive data (bcrypt, scrypt)**
- **Implement account lockout after 5 failed attempts**
- **Use CSRF tokens for forms**
- **Implement 2FA for sensitive operations**

---

### 2. Input Validation & Sanitization

#### ✅ Must Validate:
```javascript
// ❌ BAD - No validation, XSS vulnerable
const updateProfile = async (userData) => {
  await user.save(userData);
};

// ✅ GOOD - Proper validation
import DOMPurify from 'dompurify';
import validator from 'validator';

const updateProfile = async (userData) => {
  try {
    // Sanitize all string inputs
    const sanitized = {
      firstName: DOMPurify.sanitize(userData.firstName || '').trim(),
      lastName: DOMPurify.sanitize(userData.lastName || '').trim(),
      email: validator.isEmail(userData.email) ? userData.email.toLowerCase() : '',
      phone: validator.isMobilePhone(userData.phone) ? userData.phone : '',
      age: parseInt(userData.age) || 0,
      aboutMe: DOMPurify.sanitize(userData.aboutMe || '').substring(0, 500)
    };
    
    // Validate required fields
    if (!sanitized.firstName || sanitized.firstName.length < 2) {
      throw new Error('First name must be at least 2 characters');
    }
    
    if (!sanitized.email) {
      throw new Error('Valid email is required');
    }
    
    // Check age range
    if (sanitized.age < 18 || sanitized.age > 100) {
      throw new Error('Age must be between 18 and 100');
    }
    
    // Prevent SQL injection in search queries
    const safeName = sanitized.firstName.replace(/[^a-zA-Z\s]/g, '');
    
    await user.save(sanitized);
    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};
```

#### 🛡️ Validation Rules:
- **Sanitize all user inputs** (HTML, SQL, NoSQL)
- **Validate email format**
- **Validate phone numbers (with country code)**
- **Limit string lengths** (prevent buffer overflow)
- **Validate file types and sizes**
- **Use whitelist approach** (allow only known good data)
- **Encode output** (prevent XSS)
- **Parameterize queries** (prevent injection)

---

### 3. File Upload Security

#### ✅ Secure Upload Handler:
```javascript
// ❌ BAD - No validation
const uploadPhoto = async (file) => {
  const parseFile = new Parse.File(file.name, file);
  await parseFile.save();
  return parseFile.url();
};

// ✅ GOOD - With comprehensive security
const uploadPhoto = async (file, userId) => {
  try {
    // 1. Validate file exists
    if (!file) {
      throw new Error('No file provided');
    }
    
    // 2. Check file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('File size must be less than 5MB');
    }
    
    // 3. Validate file type (whitelist only)
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }
    
    // 4. Validate file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error('Invalid file extension');
    }
    
    // 5. Check for malicious content (magic numbers)
    const buffer = await file.arrayBuffer();
    const arr = new Uint8Array(buffer).subarray(0, 4);
    let header = '';
    for (let i = 0; i < arr.length; i++) {
      header += arr[i].toString(16);
    }
    
    // Validate JPEG/PNG magic numbers
    const validHeaders = {
      'ffd8ffe0': 'jpeg',
      'ffd8ffe1': 'jpeg',
      'ffd8ffe2': 'jpeg',
      '89504e47': 'png'
    };
    
    if (!validHeaders[header]) {
      throw new Error('Invalid file format');
    }
    
    // 6. Rename file securely
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const safeName = `${userId}_${timestamp}_${randomString}${fileExtension}`;
    
    // 7. Create Parse File
    const parseFile = new Parse.File(safeName, file);
    
    // 8. Save with ACL
    await parseFile.save();
    
    // 9. Set file ACL (only user can access)
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setReadAccess(userId, true);
    acl.setWriteAccess(userId, true);
    
    // 10. Log upload activity
    await trackActivity(userId, 'photo_upload', { 
      fileName: safeName,
      fileSize: file.size 
    });
    
    return {
      success: true,
      url: parseFile.url(),
      name: safeName
    };
    
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};
```

#### 📁 File Security Rules:
- **Validate file type (MIME type + extension)**
- **Check file size limits**
- **Scan for malware** (use antivirus API)
- **Verify magic numbers** (file signatures)
- **Rename files** (prevent path traversal)
- **Store outside web root**
- **Set proper permissions**
- **Use CDN with access controls**

---

### 4. Database Security

#### ✅ Secure Queries:
```javascript
// ❌ BAD - SQL injection vulnerable
const searchUsers = async (name) => {
  const query = `SELECT * FROM users WHERE name = '${name}'`;
  return await database.query(query);
};

// ✅ GOOD - Using Parse Query (safe)
const searchUsers = async (name, currentUserId) => {
  try {
    // Sanitize input
    const safeName = name.replace(/[^a-zA-Z\s]/g, '').trim();
    
    if (safeName.length < 2) {
      throw new Error('Search term must be at least 2 characters');
    }
    
    const UserProfile = Parse.Object.extend('UserProfile');
    const query = new Parse.Query(UserProfile);
    
    // Use parameterized query
    query.matches('firstName', new RegExp(safeName, 'i'));
    
    // Exclude current user
    query.notEqualTo('userId', currentUserId);
    
    // Only active profiles
    query.equalTo('isActive', true);
    
    // Set ACL - only return profiles user can see
    query.limit(20);
    query.skip(0);
    
    // Select only necessary fields (data minimization)
    query.select([
      'firstName',
      'age',
      'city',
      'profilePhoto',
      'occupation'
    ]);
    
    const results = await query.find();
    
    return results.map(user => ({
      id: user.id,
      name: user.get('firstName'),
      age: user.get('age'),
      city: user.get('city'),
      photo: user.get('profilePhoto')?.url() || null,
      occupation: user.get('occupation')
    }));
    
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};
```

#### 🗄️ Database Security Rules:
- **Use ACL (Access Control Lists)**
- **Implement CLP (Class Level Permissions)**
- **Never expose master key to frontend**
- **Use parameterized queries**
- **Encrypt sensitive fields** (PII, financial data)
- **Implement soft deletes** (keep audit trail)
- **Regular backups** (automated, tested)
- **Monitor for anomalies** (unusual queries)

---

### 5. API Security

#### ✅ Secure Cloud Function:
```javascript
// ❌ BAD - No security
Parse.Cloud.define('sendInterest', async (request) => {
  const { toUserId } = request.params;
  await saveInterest(request.user.id, toUserId);
});

// ✅ GOOD - With comprehensive security
Parse.Cloud.define('sendInterest', async (request) => {
  try {
    // 1. Check authentication
    if (!request.user) {
      throw new Error('User must be authenticated');
    }
    
    // 2. Rate limiting check
    const userActivity = await checkRateLimit(request.user.id, 'send_interest');
    if (userActivity.count >= 20) { // 20 interests per day for free users
      throw new Error('Daily interest limit reached. Upgrade to premium.');
    }
    
    // 3. Validate input
    const { toUserId, message } = request.params;
    
    if (!toUserId || typeof toUserId !== 'string') {
      throw new Error('Invalid recipient');
    }
    
    // 4. Sanitize message
    const sanitizedMessage = DOMPurify.sanitize(message || '').substring(0, 200);
    
    // 5. Check if recipient exists
    const recipientQuery = new Parse.Query(Parse.User);
    const recipient = await recipientQuery.get(toUserId);
    
    if (!recipient) {
      throw new Error('Recipient not found');
    }
    
    // 6. Check if already sent
    const InterestSent = Parse.Object.extend('InterestSent');
    const existingQuery = new Parse.Query(InterestSent);
    existingQuery.equalTo('fromUser', request.user);
    existingQuery.equalTo('toUser', recipient);
    const existing = await existingQuery.first();
    
    if (existing) {
      throw new Error('Interest already sent to this user');
    }
    
    // 7. Check if blocked
    const isBlocked = await checkIfBlocked(request.user.id, toUserId);
    if (isBlocked) {
      throw new Error('Cannot send interest to this user');
    }
    
    // 8. Create interest record with ACL
    const interest = new InterestSent();
    interest.set('fromUser', request.user);
    interest.set('toUser', recipient);
    interest.set('message', sanitizedMessage);
    interest.set('status', 'pending');
    
    const acl = new Parse.ACL();
    acl.setReadAccess(request.user.id, true);
    acl.setReadAccess(toUserId, true);
    acl.setWriteAccess(request.user.id, true);
    acl.setWriteAccess(toUserId, true);
    interest.setACL(acl);
    
    await interest.save(null, { useMasterKey: true });
    
    // 9. Send notification (async, don't wait)
    sendPushNotification(toUserId, {
      title: 'New Interest Received',
      body: `${request.user.get('firstName')} sent you an interest`,
      data: { type: 'interest', interestId: interest.id }
    }).catch(err => console.error('Notification error:', err));
    
    // 10. Track activity
    await trackActivity(request.user.id, 'interest_sent', { toUserId });
    
    return {
      success: true,
      interestId: interest.id,
      message: 'Interest sent successfully'
    };
    
  } catch (error) {
    // Log error for monitoring
    console.error('Send interest error:', {
      userId: request.user?.id,
      error: error.message,
      timestamp: new Date()
    });
    
    throw new Error(error.message || 'Failed to send interest');
  }
});
```

#### 🔌 API Security Rules:
- **Authenticate all requests**
- **Implement rate limiting**
- **Validate all inputs**
- **Use HTTPS only**
- **Implement CORS properly**
- **Hide error details in production**
- **Log all API calls**
- **Use API versioning**
- **Implement request signing**
- **Monitor for abuse**

---

### 6. Session Management

#### ✅ Secure Session Handling:
```javascript
// ❌ BAD - Insecure session
localStorage.setItem('user', JSON.stringify(userData));

// ✅ GOOD - Secure session
class SessionManager {
  constructor() {
    this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    this.WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  }
  
  // Set session with encryption
  setSession(user) {
    const sessionData = {
      userId: user.id,
      sessionToken: user.getSessionToken(),
      email: user.get('email'),
      timestamp: Date.now(),
      expiresAt: Date.now() + this.SESSION_TIMEOUT
    };
    
    // Encrypt session data
    const encrypted = this.encrypt(JSON.stringify(sessionData));
    
    // Store in sessionStorage (cleared when browser closes)
    sessionStorage.setItem('session', encrypted);
    
    // Set httpOnly cookie for additional security
    this.setSecureCookie('sessionId', user.getSessionToken());
    
    // Start session timeout
    this.startSessionTimeout();
  }
  
  // Get session with validation
  getSession() {
    const encrypted = sessionStorage.getItem('session');
    
    if (!encrypted) {
      return null;
    }
    
    try {
      const decrypted = this.decrypt(encrypted);
      const session = JSON.parse(decrypted);
      
      // Check if session expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }
      
      // Extend session on activity
      this.extendSession();
      
      return session;
    } catch (error) {
      console.error('Session error:', error);
      this.clearSession();
      return null;
    }
  }
  
  // Clear session
  clearSession() {
    sessionStorage.removeItem('session');
    this.deleteSecureCookie('sessionId');
    this.stopSessionTimeout();
  }
  
  // Extend session on user activity
  extendSession() {
    const session = this.getSession();
    if (session) {
      session.expiresAt = Date.now() + this.SESSION_TIMEOUT;
      const encrypted = this.encrypt(JSON.stringify(session));
      sessionStorage.setItem('session', encrypted);
    }
  }
  
  // Start session timeout warning
  startSessionTimeout() {
    this.timeoutWarning = setTimeout(() => {
      alert('Your session will expire in 5 minutes. Please save your work.');
    }, this.SESSION_TIMEOUT - this.WARNING_TIME);
    
    this.timeoutExpiry = setTimeout(() => {
      this.clearSession();
      window.location.href = '/login?reason=timeout';
    }, this.SESSION_TIMEOUT);
  }
  
  // Stop session timeout
  stopSessionTimeout() {
    if (this.timeoutWarning) clearTimeout(this.timeoutWarning);
    if (this.timeoutExpiry) clearTimeout(this.timeoutExpiry);
  }
  
  // Simple encryption (use proper crypto in production)
  encrypt(text) {
    // Use Web Crypto API or CryptoJS
    return btoa(text); // Simplified for example
  }
  
  decrypt(encrypted) {
    return atob(encrypted); // Simplified for example
  }
  
  // Set secure cookie
  setSecureCookie(name, value) {
    document.cookie = `${name}=${value}; Secure; HttpOnly; SameSite=Strict; Max-Age=1800`;
  }
  
  // Delete cookie
  deleteSecureCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}
```

#### 🔑 Session Security Rules:
- **Use secure, httpOnly cookies**
- **Implement session timeout**
- **Encrypt session data**
- **Regenerate session ID after login**
- **Clear session on logout**
- **Implement "Remember Me" securely**
- **Detect concurrent sessions**
- **Log session activities**

---

### 7. Payment Security

#### ✅ Secure Payment Processing:
```javascript
// ❌ BAD - Insecure payment handling
const processPayment = async (cardNumber, cvv, amount) => {
  return await paymentGateway.charge(cardNumber, cvv, amount);
};

// ✅ GOOD - PCI DSS compliant
const processPayment = async (userId, planId) => {
  try {
    // 1. Validate user authentication
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // 2. Get plan details from server (never trust client)
    const plan = await getPlanDetails(planId);
    if (!plan) {
      throw new Error('Invalid plan');
    }
    
    // 3. Create Razorpay order (server-side only)
    const orderOptions = {
      amount: plan.amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId: userId,
        planId: planId
      }
    };
    
    // Never expose API keys to frontend
    const order = await Razorpay.orders.create(orderOptions);
    
    // 4. Return order details to frontend (no sensitive data)
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      // Frontend will use Razorpay checkout with this info
    };
    
  } catch (error) {
    console.error('Payment creation error:', error);
    throw error;
  }
};

// Verify payment on backend
const verifyPayment = async (paymentData) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    
    // 1. Verify signature (crucial for security)
    const crypto = require('crypto');
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      throw new Error('Payment verification failed');
    }
    
    // 2. Fetch payment details from Razorpay
    const payment = await Razorpay.payments.fetch(razorpay_payment_id);
    
    // 3. Verify payment status
    if (payment.status !== 'captured') {
      throw new Error('Payment not captured');
    }
    
    // 4. Update subscription in database
    await activateSubscription(payment.notes.userId, payment.notes.planId);
    
    // 5. Log payment
    await logPayment({
      userId: payment.notes.userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: payment.amount,
      status: 'success'
    });
    
    return { success: true, message: 'Payment verified' };
    
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};
```

#### 💳 Payment Security Rules:
- **Never store card details**
- **Use PCI DSS compliant gateway**
- **Verify payment signatures**
- **Process payments server-side only**
- **Log all transactions**
- **Implement fraud detection**
- **Use HTTPS only**
- **Encrypt payment logs**
- **Implement refund workflow**
- **Regular security audits**

---

## 🐛 BUG PREVENTION STRATEGIES

### 1. Type Checking with PropTypes

```javascript
// ✅ Always define PropTypes
import PropTypes from 'prop-types';

const ProfileCard = ({ user, onInterest, isPremium }) => {
  return (
    <div className="profile-card">
      <h3>{user.name}</h3>
      <p>{user.age} years</p>
      {isPremium && <span className="badge">Premium</span>}
      <button onClick={() => onInterest(user.id)}>Send Interest</button>
    </div>
  );
};

ProfileCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    age: PropTypes.number.isRequired,
    photo: PropTypes.string
  }).isRequired,
  onInterest: PropTypes.func.isRequired,
  isPremium: PropTypes.bool
};

ProfileCard.defaultProps = {
  isPremium: false
};
```

### 2. Error Boundaries

```javascript
// ✅ Wrap components in error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error tracking service (Sentry, LogRocket, etc.)
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>We're working on fixing this issue.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 3. Null/Undefined Checks

```javascript
// ❌ BAD - Can crash if user is undefined
const displayName = user.firstName + ' ' + user.lastName;

// ✅ GOOD - Safe access
const displayName = user?.firstName 
  ? `${user.firstName} ${user.lastName || ''}`.trim() 
  : 'Anonymous';

// ✅ GOOD - With default values
const age = user?.age ?? 18;
const location = user?.city || user?.state || 'Not specified';
```

### 4. Async Error Handling

```javascript
// ❌ BAD - No error handling
const fetchProfile = async (userId) => {
  const response = await fetch(`/api/profile/${userId}`);
  const data = await response.json();
  return data;
};

// ✅ GOOD - Comprehensive error handling
const fetchProfile = async (userId) => {
  try {
    // Validate input
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Set timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(`/api/profile/${userId}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    clearTimeout(timeoutId);
    
    // Check response status
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Profile not found');
      } else if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Unauthorized');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }
    
    return data;
    
  } catch (error) {
    // Handle different error types
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection.');
    }
    
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    // Log error for debugging
    console.error('Fetch profile error:', {
      userId,
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};
```

### 5. Memory Leak Prevention

```javascript
// ❌ BAD - Memory leak with event listeners
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
}, []);

// ✅ GOOD - Cleanup event listeners
useEffect(() => {
  const handleScroll = () => {
    // Handle scroll
  };
  
  window.addEventListener('scroll', handleScroll);
  
  // Cleanup function
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);

// ✅ GOOD - Cleanup timers
useEffect(() => {
  const timerId = setTimeout(() => {
    // Do something
  }, 1000);
  
  return () => clearTimeout(timerId);
}, []);

// ✅ GOOD - Cancel async operations
useEffect(() => {
  let isMounted = true;
  
  const fetchData = async () => {
    const data = await fetchProfile(userId);
    if (isMounted) {
      setProfile(data);
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;
  };
}, [userId]);
```

---

## ✅ CODE QUALITY STANDARDS

### 1. ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:security/recommended'
  ],
  plugins: ['security'],
  rules: {
    // Enforce security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    
    // Code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // React specific
    'react/prop-types': 'error',
    'react/no-unused-state': 'warn',
    'react/no-direct-mutation-state': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

### 2. Code Comments

```javascript
// ✅ GOOD - Clear, useful comments
/**
 * Calculates compatibility score between two users
 * @param {Object} user1 - First user's profile
 * @param {Object} user2 - Second user's profile
 * @returns {number} Compatibility score (0-100)
 * @throws {Error} If required profile fields are missing
 */
const calculateCompatibility = (user1, user2) => {
  // Validate inputs
  if (!user1 || !user2) {
    throw new Error('Both user profiles are required');
  }
  
  let score = 0;
  
  // Age compatibility (max 25 points)
  const ageDiff = Math.abs(user1.age - user2.age);
  score += Math.max(0, 25 - (ageDiff * 2));
  
  // Religion match (25 points)
  if (user1.religion === user2.religion) {
    score += 25;
  }
  
  // Education level (25 points)
  if (user1.education === user2.education) {
    score += 25;
  }
  
  // Location proximity (25 points)
  if (user1.city === user2.city) {
    score += 25;
  } else if (user1.state === user2.state) {
    score += 15;
  }
  
  return Math.min(100, Math.round(score));
};
```

### 3. Naming Conventions

```javascript
// ✅ GOOD naming conventions

// Constants - UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const API_BASE_URL = 'https://api.matrimony.com';

// Classes - PascalCase
class UserProfile extends React.Component {}

// Functions - camelCase
const calculateAge = (dateOfBirth) => {};

// Boolean variables - is/has/should prefix
const isVerified = true;
const hasPhoto = false;
const shouldShowModal = true;

// Arrays - plural nouns
const users = [];
const profilePhotos = [];

// Event handlers - handle/on prefix
const handleSubmit = () => {};
const onProfileClick = () => {};

// Async functions - clear verb
const fetchUserProfile = async () => {};
const saveProfile = async () => {};
```

### 4. Code Organization

```javascript
// ✅ GOOD file structure
src/
├── components/
│   ├── common/          // Reusable components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   └── Modal.jsx
│   ├── profile/         // Profile-specific components
│   │   ├── ProfileCard.jsx
│   │   ├── ProfileForm.jsx
│   │   └── ProfileGallery.jsx
│   └── layout/          // Layout components
│       ├── Header.jsx
│       ├── Footer.jsx
│       └── Sidebar.jsx
├── pages/               // Page components
├── hooks/               // Custom hooks
│   ├── useAuth.js
│   ├── useProfile.js
│   └── useChat.js
├── utils/               // Utility functions
│   ├── validators.js
│   ├── formatters.js
│   └── api.js
├── services/            // API services
│   ├── authService.js
│   ├── profileService.js
│   └── chatService.js
├── context/             // Context providers
│   ├── AuthContext.js
│   └── ThemeContext.js
├── constants/           // Constants
│   ├── apiEndpoints.js
│   └── appConfig.js
└── styles/              // Global styles
```

---

## 🧪 TESTING REQUIREMENTS

### 1. Unit Tests

```javascript
// ProfileCard.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileCard from './ProfileCard';

describe('ProfileCard Component', () => {
  const mockUser = {
    id: '123',
    name: 'John Doe',
    age: 28,
    city: 'Mumbai',
    photo: 'https://example.com/photo.jpg'
  };
  
  const mockOnInterest = jest.fn();
  
  test('renders user information correctly', () => {
    render(<ProfileCard user={mockUser} onInterest={mockOnInterest} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('28 years')).toBeInTheDocument();
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
  });
  
  test('calls onInterest when button clicked', () => {
    render(<ProfileCard user={mockUser} onInterest={mockOnInterest} />);
    
    const button = screen.getByText('Send Interest');
    fireEvent.click(button);
    
    expect(mockOnInterest).toHaveBeenCalledWith('123');
    expect(mockOnInterest).toHaveBeenCalledTimes(1);
  });
  
  test('handles missing photo gracefully', () => {
    const userWithoutPhoto = { ...mockUser, photo: null };
    render(<ProfileCard user={userWithoutPhoto} onInterest={mockOnInterest} />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('default'));
  });
});
```

### 2. Integration Tests

```javascript
// login.integration.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import * as authService from '../services/authService';

jest.mock('../services/authService');

describe('Login Integration Tests', () => {
  test('successful login flow', async () => {
    authService.login.mockResolvedValue({
      success: true,
      user: { id: '123', email: 'test@example.com' }
    });
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Login'));
    
    // Wait for success
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });
  
  test('shows error on failed login', async () => {
    authService.login.mockRejectedValue(
      new Error('Invalid credentials')
    );
    
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong' }
    });
    
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
```

### 3. E2E Tests (Cypress)

```javascript
// cypress/e2e/registration.cy.js
describe('User Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/register');
  });
  
  it('completes full registration', () => {
    // Step 1: Fill basic info
    cy.get('[name="firstName"]').type('John');
    cy.get('[name="lastName"]').type('Doe');
    cy.get('[name="email"]').type('john@example.com');
    cy.get('[name="phone"]').type('9876543210');
    cy.get('[name="password"]').type('SecurePass123!');
    cy.get('[name="confirmPassword"]').type('SecurePass123!');
    cy.get('[type="checkbox"]').check();
    cy.contains('Next').click();
    
    // Step 2: Enter OTP
    cy.get('[data-testid="otp-1"]').type('1');
    cy.get('[data-testid="otp-2"]').type('2');
    cy.get('[data-testid="otp-3"]').type('3');
    cy.get('[data-testid="otp-4"]').type('4');
    cy.get('[data-testid="otp-5"]').type('5');
    cy.get('[data-testid="otp-6"]').type('6');
    cy.contains('Verify').click();
    
    // Step 3: Success
    cy.contains('Registration Successful').should('be.visible');
    cy.contains('Go to Dashboard').click();
    
    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
  });
  
  it('shows validation errors', () => {
    cy.contains('Next').click();
    cy.contains('First name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
  });
});
```

---

## 🔍 CODE REVIEW CHECKLIST

### Before Submitting Code:

#### Security ✅
- [ ] No hardcoded credentials or API keys
- [ ] All user inputs are validated and sanitized
- [ ] SQL/NoSQL injection prevention implemented
- [ ] XSS prevention implemented
- [ ] CSRF protection in place
- [ ] Proper authentication checks
- [ ] Secure file upload handling
- [ ] No sensitive data in logs
- [ ] HTTPS enforced
- [ ] Proper error messages (no sensitive info leaked)

#### Code Quality ✅
- [ ] Code follows naming conventions
- [ ] Functions are small and focused (< 50 lines)
- [ ] No duplicate code
- [ ] Proper comments for complex logic
- [ ] No console.logs in production code
- [ ] PropTypes defined for all components
- [ ] Error boundaries implemented
- [ ] Loading states handled
- [ ] Empty states handled

#### Performance ✅
- [ ] No unnecessary re-renders
- [ ] Proper use of useCallback/useMemo
- [ ] Images optimized and lazy loaded
- [ ] Debouncing/throttling for frequent operations
- [ ] Pagination for large lists
- [ ] Proper cleanup in useEffect
- [ ] No memory leaks

#### Testing ✅
- [ ] Unit tests written and passing
- [ ] Integration tests for critical flows
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Mock data used appropriately

#### Accessibility ✅
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG standards
- [ ] Alt text for images
- [ ] Focus indicators visible

#### Documentation ✅
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Complex functions documented
- [ ] Breaking changes noted

---

## 🚨 COMMON VULNERABILITIES & FIXES

### 1. XSS (Cross-Site Scripting)

```javascript
// ❌ VULNERABLE
const AboutMe = ({ text }) => {
  return <div dangerouslySetInnerHTML={{ __html: text }} />;
};

// ✅ FIXED
import DOMPurify from 'dompurify';

const AboutMe = ({ text }) => {
  const sanitized = DOMPurify.sanitize(text);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};
```

### 2. CSRF (Cross-Site Request Forgery)

```javascript
// ✅ Implement CSRF token
const sendInterest = async (toUserId) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
  
  const response = await fetch('/api/interest/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ toUserId })
  });
  
  return response.json();
};
```

### 3. Insecure Direct Object Reference (IDOR)

```javascript
// ❌ VULNERABLE
Parse.Cloud.define('getProfile', async (request) => {
  const { userId } = request.params;
  const profile = await new Parse.Query('UserProfile')
    .get(userId, { useMasterKey: true });
  return profile;
});

// ✅ FIXED
Parse.Cloud.define('getProfile', async (request) => {
  const { userId } = request.params;
  
  // Check authorization
  if (userId !== request.user.id) {
    // Check if user has permission to view
    const canView = await checkViewPermission(request.user.id, userId);
    if (!canView) {
      throw new Error('Unauthorized access');
    }
  }
  
  const query = new Parse.Query('UserProfile');
  query.equalTo('userId', userId);
  const profile = await query.first();
  
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  return profile;
});
```

### 4. Rate Limiting

```javascript
// ✅ Implement rate limiting
const rateLimit = new Map();

const checkRateLimit = (userId, action) => {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const limit = 20; // 20 requests
  const window = 60 * 60 * 1000; // 1 hour
  
  if (!rateLimit.has(key)) {
    rateLimit.set(key, []);
  }
  
  const requests = rateLimit.get(key);
  
  // Remove old requests
  const recent = requests.filter(time => now - time < window);
  
  if (recent.length >= limit) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  recent.push(now);
  rateLimit.set(key, recent);
  
  return { count: recent.length, limit };
};
```

---

## 📚 ADDITIONAL RESOURCES

### Security Tools
- **ESLint Security Plugin**: Detect security vulnerabilities
- **Snyk**: Dependency vulnerability scanning
- **OWASP ZAP**: Security testing
- **Helmet.js**: Secure HTTP headers
- **DOMPurify**: XSS sanitization

### Testing Tools
- **Jest**: Unit testing
- **React Testing Library**: Component testing
- **Cypress**: E2E testing
- **Lighthouse**: Performance testing

### Monitoring Tools
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Google Analytics**: Usage analytics
- **New Relic**: Performance monitoring

---

## ✅ FINAL CHECKLIST

### Before Every Deployment:

- [ ] All tests passing
- [ ] Security scan completed
- [ ] Code review approved
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Backup created
- [ ] Rollback plan ready
- [ ] Monitoring alerts configured
- [ ] Performance benchmarks met

---

**Remember: Security and quality are ongoing processes, not one-time tasks!**

**Last Updated:** November 7, 2025  
**Version:** 1.0
