# ⚡ QUICK REFERENCE GUIDE
## Matrimony AI Platform - Developer Cheat Sheet

---

## 🚀 QUICK START

```bash
# Navigate to project
cd D:\claude\matrimony-platform\frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000
```

---

## 📝 COMMON COMMANDS

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Code Quality
```bash
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix issues
npm run format           # Format with Prettier
```

### Testing
```bash
npm run test             # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Security
```bash
npm run security:check   # Check vulnerabilities
npm run security:fix     # Fix vulnerabilities
npm run validate         # Full validation
```

---

## 🔒 SECURITY UTILITIES - COPY & PASTE READY

### Import Security Utils
```javascript
import {
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
  
  // File Validation
  validateImageFile,
  validatePdfFile,
  
  // Rate Limiting
  rateLimiter,
  
  // Security
  getSecureHeaders,
  
  // Error Handling
  getUserFriendlyError,
  
  // Logging
  secureLog
} from '../utils/security';
```

### Email Validation
```javascript
if (!isValidEmail(email)) {
  setError('Invalid email format');
  return;
}
```

### Phone Validation
```javascript
if (!isValidPhone(phone)) {
  setError('Invalid phone number');
  return;
}
```

### Password Validation
```javascript
const result = validatePassword(password);
if (!result.valid) {
  setError(result.message);
  return;
}
// result.strength = 0-5
// result.requirements = { minLength, hasUpperCase, ... }
```

### Text Sanitization
```javascript
// Remove HTML, trim, limit length
const safeText = sanitizeText(userInput, 500);
```

### HTML Sanitization
```javascript
// Allow only safe HTML tags
const safeHtml = sanitizeHtml(htmlInput);
```

### File Validation
```javascript
const result = validateImageFile(file);
if (!result.valid) {
  alert(result.message);
  return;
}
// File is safe to upload
```

### Rate Limiting
```javascript
// 5 attempts per 5 minutes
const result = rateLimiter.checkLimit('action_userId', 5, 300000);
if (!result.allowed) {
  alert(result.message);
  return;
}
```

### Secure API Headers
```javascript
const headers = getSecureHeaders(authToken);
fetch('/api/endpoint', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(data)
});
```

### User-Friendly Errors
```javascript
try {
  await someOperation();
} catch (error) {
  setError(getUserFriendlyError(error));
}
```

---

## 📦 COMPONENT TEMPLATE

```javascript
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { sanitizeText, isValidEmail } from '../utils/security';

const MyComponent = ({ title, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate
    if (!isValidEmail(email)) {
      setError('Invalid email');
      return;
    }
    
    // Sanitize
    const safeEmail = sanitizeText(email);
    
    // Submit
    setLoading(true);
    try {
      await onSubmit(safeEmail);
    } catch (error) {
      setError(getUserFriendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-component">
      <h2>{title}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default MyComponent;
```

---

## 🔐 SECURE FORM TEMPLATE

```javascript
import React, { useState } from 'react';
import {
  isValidEmail,
  isValidPhone,
  validatePassword,
  sanitizeText,
  rateLimiter,
  getUserFriendlyError
} from '../utils/security';

const SecureForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = 'Name must be at least 2 characters';
    }
    
    if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    
    const passwordCheck = validatePassword(formData.password);
    if (!passwordCheck.valid) {
      newErrors.password = passwordCheck.message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!validate()) {
      return;
    }
    
    // Rate limit
    const limit = rateLimiter.checkLimit('submit_form', 3, 60000);
    if (!limit.allowed) {
      setErrors({ form: limit.message });
      return;
    }
    
    // Sanitize
    const sanitized = {
      firstName: sanitizeText(formData.firstName),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone.replace(/\s+/g, ''),
      password: formData.password
    };
    
    // Submit
    setLoading(true);
    try {
      await submitForm(sanitized);
      alert('Success!');
    } catch (error) {
      setErrors({ form: getUserFriendlyError(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        placeholder="First Name"
      />
      {errors.firstName && <span>{errors.firstName}</span>}
      
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email}</span>}
      
      <input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Phone"
      />
      {errors.phone && <span>{errors.phone}</span>}
      
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Password"
      />
      {errors.password && <span>{errors.password}</span>}
      
      {errors.form && <div className="error">{errors.form}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

export default SecureForm;
```

---

## 📁 FILE UPLOAD TEMPLATE

```javascript
import React, { useState } from 'react';
import { validateImageFile, sanitizeFileName } from '../utils/security';

const FileUpload = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    
    if (!selectedFile) {
      return;
    }
    
    // Validate
    const result = validateImageFile(selectedFile);
    if (!result.valid) {
      setError(result.message);
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }
    
    setUploading(true);
    try {
      // Sanitize file name
      const safeName = sanitizeFileName(file.name);
      
      // Upload
      await onUpload(file, safeName);
      alert('Upload successful!');
      setFile(null);
    } catch (error) {
      setError(getUserFriendlyError(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {file && <p>Selected: {file.name}</p>}
      {error && <p className="error">{error}</p>}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default FileUpload;
```

---

## 🎨 COMMON CSS CLASSES

```css
/* Error message */
.error {
  color: #EF4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Success message */
.success {
  color: #10B981;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Loading spinner */
.loading {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #EC4899;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Button disabled */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Input error */
input.error {
  border-color: #EF4444;
}

/* Card hover */
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
```

---

## 🐛 DEBUGGING TIPS

### Check Browser Console
```javascript
console.log('Debug:', variable);
console.error('Error:', error);
console.warn('Warning:', message);
```

### React DevTools
- Install React DevTools extension
- Inspect component props and state
- Check component hierarchy

### Network Tab
- Check API requests
- Verify request/response
- Check status codes

### Common Issues
```javascript
// Issue: Component not re-rendering
// Solution: Check if state is being updated correctly
const [count, setCount] = useState(0);
setCount(count + 1); // ✅ Correct
count = count + 1;   // ❌ Wrong

// Issue: Memory leak warning
// Solution: Cleanup in useEffect
useEffect(() => {
  const handler = () => {};
  window.addEventListener('event', handler);
  return () => window.removeEventListener('event', handler);
}, []);

// Issue: Infinite loop
// Solution: Add dependencies to useEffect
useEffect(() => {
  fetchData();
}, []); // ✅ Add empty array
```

---

## 📚 HELPFUL LINKS

### Documentation
- [React Docs](https://react.dev)
- [Parse Server](https://docs.parseplatform.org)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Back4App Docs](https://www.back4app.com/docs)

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [Web Security](https://web.dev/security/)

### Project Docs
- `SECURITY-AND-QUALITY-GUIDE.md` - Security best practices
- `PRE-DEPLOYMENT-CHECKLIST.md` - Deployment guide
- `COMPLETE-WEBSITE-PLAN.md` - Full project plan
- `SYSTEM-ARCHITECTURE.md` - Architecture diagram

---

## ✅ PRE-COMMIT CHECKLIST

Before every commit:
- [ ] Run `npm run lint`
- [ ] Run `npm run test`
- [ ] Check for console.logs
- [ ] Check for TODO comments
- [ ] Verify all imports used
- [ ] Test in browser
- [ ] Check for errors

---

## 🚨 EMERGENCY FIXES

### Server Not Starting
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Build Errors
```bash
npm run lint:fix
npm run format
npm run build
```

### Database Issues
- Check Back4App dashboard
- Verify API keys
- Check network connection

---

**Last Updated:** November 7, 2025  
**Keep this handy for quick reference!** 📌
