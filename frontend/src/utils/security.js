/**
 * Security Utilities
 * Secure helper functions for input validation, sanitization, and encryption
 */

import DOMPurify from 'dompurify';
import validator from 'validator';

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return validator.isEmail(email.trim());
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Indian phone format: 10 digits, starting with 6-9
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with strength score
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required', strength: 0 };
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters`,
      strength: 0
    };
  }

  let strength = 0;
  if (password.length >= minLength) strength++;
  if (hasUpperCase) strength++;
  if (hasLowerCase) strength++;
  if (hasNumbers) strength++;
  if (hasSpecialChar) strength++;

  const messages = {
    1: 'Very Weak',
    2: 'Weak',
    3: 'Medium',
    4: 'Strong',
    5: 'Very Strong'
  };

  return {
    valid: strength >= 3,
    message: messages[strength] || 'Invalid',
    strength: strength,
    requirements: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    }
  };
};

/**
 * Validate age (must be between 18-100)
 * @param {number|string} age - Age to validate
 * @returns {boolean} - True if valid
 */
export const isValidAge = (age) => {
  const ageNum = parseInt(age, 10);
  return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100;
};

/**
 * Validate name (only letters and spaces)
 * @param {string} name - Name to validate
 * @returns {boolean} - True if valid
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize HTML input to prevent XSS
 * @param {string} input - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitize text input (remove HTML, trim, limit length)
 * @param {string} input - Text to sanitize
 * @param {number} maxLength - Maximum length (default 500)
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (input, maxLength = 500) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove HTML tags
  const stripped = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  // Trim and limit length
  return stripped.trim().substring(0, maxLength);
};

/**
 * Sanitize search query
 * @param {string} query - Search query
 * @returns {string} - Sanitized query
 */
export const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return '';
  }
  // Remove special characters that could be used for injection
  return query
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .substring(0, 100);
};

/**
 * Sanitize file name
 * @param {string} fileName - Original file name
 * @returns {string} - Safe file name
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return 'file';
  }
  // Remove path traversal attempts
  const name = fileName.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  // Keep only safe characters
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
};

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validate file type (images only)
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export const validateImageFile = (file) => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { valid: false, message: 'No file provided' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: 'Only JPEG, PNG, and WebP images are allowed'
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      message: 'File size must be less than 5MB'
    };
  }

  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  if (!allowedExtensions.includes(extension)) {
    return { valid: false, message: 'Invalid file extension' };
  }

  return { valid: true, message: 'File is valid' };
};

/**
 * Validate PDF file
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export const validatePdfFile = (file) => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (!file) {
    return { valid: false, message: 'No file provided' };
  }

  if (file.type !== 'application/pdf') {
    return { valid: false, message: 'Only PDF files are allowed' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, message: 'File size must be less than 10MB' };
  }

  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (extension !== '.pdf') {
    return { valid: false, message: 'Invalid file extension' };
  }

  return { valid: true, message: 'File is valid' };
};

// ============================================================================
// ENCRYPTION & ENCODING
// ============================================================================

/**
 * Simple base64 encoding (for non-sensitive data display)
 * @param {string} str - String to encode
 * @returns {string} - Encoded string
 */
export const encodeBase64 = (str) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (error) {
    console.error('Encoding error:', error);
    return '';
  }
};

/**
 * Simple base64 decoding
 * @param {string} str - String to decode
 * @returns {string} - Decoded string
 */
export const decodeBase64 = (str) => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (error) {
    console.error('Decoding error:', error);
    return '';
  }
};

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Simple client-side rate limiter
 */
class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  /**
   * Check if action is allowed
   * @param {string} key - Unique key for the action
   * @param {number} maxAttempts - Maximum attempts allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} - Result with allowed status
   */
  checkLimit(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();

    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const attempts = this.attempts.get(key);
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter((time) => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const waitTime = Math.ceil((oldestAttempt + windowMs - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        message: `Too many attempts. Please try again in ${waitTime} seconds.`
      };
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return {
      allowed: true,
      remaining: maxAttempts - recentAttempts.length,
      message: 'Action allowed'
    };
  }

  /**
   * Reset rate limit for a key
   * @param {string} key - Key to reset
   */
  reset(key) {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll() {
    this.attempts.clear();
  }
}

export const rateLimiter = new RateLimiter();

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Get secure headers for API requests
 * @param {string} token - Authentication token
 * @returns {Object} - Headers object
 */
export const getSecureHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add CSRF token if available
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Create user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} - User-friendly message
 */
export const getUserFriendlyError = (error) => {
  // Don't expose technical details to users
  const errorMessages = {
    'Network request failed': 'Network error. Please check your connection.',
    'Failed to fetch': 'Unable to connect. Please try again.',
    'timeout': 'Request timeout. Please try again.',
    '401': 'Session expired. Please login again.',
    '403': 'You don\'t have permission to perform this action.',
    '404': 'Resource not found.',
    '500': 'Server error. Please try again later.',
    '503': 'Service temporarily unavailable.'
  };

  const message = error?.message || error?.toString() || '';

  // Check for known error patterns
  for (const [key, value] of Object.entries(errorMessages)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // Generic error message
  return 'Something went wrong. Please try again.';
};

// ============================================================================
// LOGGING (Secure - No Sensitive Data)
// ============================================================================

/**
 * Secure logger that removes sensitive data
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {Object} data - Additional data (will be sanitized)
 */
export const secureLog = (level, message, data = {}) => {
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'ssn',
    'creditCard',
    'cvv'
  ];

  const sanitizedData = { ...data };
  sensitiveFields.forEach((field) => {
    if (sanitizedData[field]) {
      sanitizedData[field] = '***REDACTED***';
    }
  });

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: sanitizedData
  };

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (Sentry, LogRocket, etc.)
    // sendToLoggingService(logEntry);
  } else {
    // Console log in development
    console[level](message, sanitizedData);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Validation
  isValidEmail,
  isValidPhone,
  validatePassword,
  isValidAge,
  isValidName,

  // Sanitization
  sanitizeHtml,
  sanitizeText,
  sanitizeSearchQuery,
  sanitizeFileName,

  // File validation
  validateImageFile,
  validatePdfFile,

  // Encoding
  encodeBase64,
  decodeBase64,

  // Rate limiting
  rateLimiter,

  // Security
  getSecureHeaders,

  // Error handling
  getUserFriendlyError,

  // Logging
  secureLog
};
