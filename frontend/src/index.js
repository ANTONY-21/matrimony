import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Parse from 'parse';

// Initialize Parse with Back4App credentials
Parse.initialize(
  'CbVGxOMxBWjB9PX56jNvJwJI3IxLelLYMZEP3zkH',  // Application ID
  'JwT7c97VJ7VuvmYwsobZUDHwoFLIRghWygDNV5Iy'   // JavaScript Key
);
Parse.serverURL = 'https://parseapi.back4app.com';

// Make Parse available globally (optional, but helpful for debugging)
window.Parse = Parse;

console.log('✅ Parse initialized successfully!');
console.log('📡 Server URL:', Parse.serverURL);
console.log('🔑 App ID:', Parse.applicationId);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
