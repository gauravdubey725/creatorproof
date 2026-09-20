/**
 * CreatorProof - Application Core, Validation & API Integration Module
 * Enforces cryptographic and profile integrity constraints and coordinates backend API calls.
 */

// Global App Namespace
const App = (typeof window !== 'undefined' ? (window.App = window.App || {}) : {});
if (typeof globalThis !== 'undefined') {
  globalThis.App = App;
}

// Configurable API Base URL pointing to CreatorProof backend
const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : "http://localhost:3000";
App.API_BASE_URL = API_BASE_URL;

/**
 * Resolves full API endpoint URL
 */
function getApiUrl(endpoint) {
  const base = (App.API_BASE_URL || "http://localhost:3000").replace(/\/+$/, '');
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (base.endsWith('/api') && clean.startsWith('/api/')) {
    return base + clean.substring(4);
  }
  return base + clean;
}

/**
 * Helper to get authentication token from localStorage
 */
function getAuthToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('mockToken') || localStorage.getItem('authToken');
}

/**
 * Helper to build headers with Authorization Bearer token
 */
function getAuthHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Validates Full Name / Creator Pseudonym
 * - Must contain ONLY letters, spaces, hyphens, apostrophes, and dots.
 * - Must be at least 2 characters.
 * @param {string} name
 * @returns {boolean}
 */
function validateName(name) {
  if (name === null || name === undefined || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  const nameRegex = /^[a-zA-Z\s\-\'\.]{2,}$/;
  return nameRegex.test(trimmed) && /[a-zA-Z]/.test(trimmed);
}

/**
 * Validates Email Address
 * - Must use strict regex: local-part@domain.extension
 * - Domain must have at least one dot and a TLD of at least 2 letters.
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
  if (email === null || email === undefined || typeof email !== 'string') return false;
  const val = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(val)) return false;

  const parts = val.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.startsWith('.') || local.endsWith('.')) return false;
  if (!domain || domain.startsWith('.') || domain.endsWith('.') || domain.startsWith('-') || domain.endsWith('-')) return false;

  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;

  return true;
}

/**
 * Validates Phone Number
 * - Optional: empty or whitespace-only is valid.
 * - If filled, must match E.164, US format, or 10-15 digits.
 * @param {string} phone
 * @returns {boolean}
 */
function validatePhone(phone) {
  if (phone === null || phone === undefined) return true;
  if (typeof phone !== 'string') return false;
  const val = phone.trim();
  if (val === '') return true;

  if (val.startsWith('-')) return false;

  const e164Regex = /^\+[1-9]\d{7,14}$/;
  const usRegex = /^(\([0-9]{3}\)\s*|[0-9]{3}[-.\s])[0-9]{3}[-.\s][0-9]{4}$/;
  const digitsRegex = /^\d{10,15}$/;

  return e164Regex.test(val) || usRegex.test(val) || digitsRegex.test(val);
}

/**
 * Validates Username / Handle
 * - Must be at least 3 characters.
 * - Must contain ONLY letters, numbers, underscores, and hyphens.
 * @param {string} username
 * @returns {boolean}
 */
function validateUsername(username) {
  if (username === null || username === undefined || typeof username !== 'string') return false;
  const val = username.trim();
  if (val.length < 3) return false;
  const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/;
  return usernameRegex.test(val);
}

/**
 * Validates Website URL
 * - Optional: empty or whitespace-only is valid.
 * - If filled, must start with http:// or https:// and be a valid URL.
 * @param {string} url
 * @returns {boolean}
 */
function validateUrl(url) {
  if (url === null || url === undefined) return true;
  if (typeof url !== 'string') return false;
  const val = url.trim();
  if (val === '') return true;

  if (!val.startsWith('http://') && !val.startsWith('https://')) {
    return false;
  }

  try {
    const parsed = new URL(val);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Calculates cryptographic SHA-256 hash using Web Crypto API in browser or Node crypto
 * @param {File | Blob | ArrayBuffer | string} data
 * @returns {Promise<string>}
 */
async function calculateSHA256(data) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    let buffer;
    if (data instanceof ArrayBuffer) {
      buffer = data;
    } else if (data instanceof Blob || (typeof File !== 'undefined' && data instanceof File)) {
      buffer = await data.arrayBuffer();
    } else if (typeof data === 'string') {
      buffer = new TextEncoder().encode(data);
    } else {
      throw new Error('Unsupported data type for calculateSHA256');
    }

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else if (typeof require !== 'undefined') {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  throw new Error('Crypto API not available');
}

/**
 * Displays a toast notification message
 * @param {string} message
 * @param {'info' | 'success' | 'error' | 'warning'} type
 */
function showToast(message, type = 'info') {
  if (typeof document === 'undefined') return;

  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position:fixed;top:1.25rem;right:1.25rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;max-width:24rem;width:calc(100% - 2.5rem);';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const isError = type === 'error';
  const isSuccess = type === 'success';

  const bgColor = isError ? '#881337' : isSuccess ? '#064e3b' : '#0f172a';
  const borderColor = isError ? '#e11d48' : isSuccess ? '#10b981' : '#334155';
  const textColor = '#ffffff';

  toast.style.cssText = `
    padding: 0.875rem 1.125rem;
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
    border: 1px solid ${borderColor};
    background-color: ${bgColor};
    color: ${textColor};
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    pointer-events: auto;
    transition: all 0.25s ease-in-out;
  `;

  const icon = isError ? '⚠️' : isSuccess ? '✅' : 'ℹ️';
  toast.innerHTML = `<span style="font-size:1.1rem;flex-shrink:0;">${icon}</span><span style="flex:1;">${message}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

// ----------------------------------------------------
// Authentication API Calls
// ----------------------------------------------------

/**
 * Register a new user
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @param {string} username
 */
async function signup(email, password, name, username) {
  try {
    const res = await fetch(getApiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, username })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Registration failed.');
    }

    if (data.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('mockToken', data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('mockUser', JSON.stringify(data.user));
    }

    return data;
  } catch (err) {
    console.error('Signup error:', err);
    throw err;
  }
}

/**
 * Log in an existing user
 * @param {string} identifier (email or username)
 * @param {string} password
 */
async function login(identifier, password) {
  try {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, identifier, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login failed.');
    }

    if (data.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('mockToken', data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('mockUser', JSON.stringify(data.user));
    }

    return data;
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
}

/**
 * Demo login helper
 */
async function demoLogin() {
  return login('alex.vance@creatorproof.io', 'Password123!');
}

/**
 * Log out the current user
 */
function logout() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('mockToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('mockUser');
  }
}

/**
 * Get current user profile from token
 */
async function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(getApiUrl('/api/auth/me'), {
      headers: getAuthHeaders(true)
    });

    if (!res.ok) {
      logout();
      return null;
    }

    const data = await res.json();
    if (data.success && data.user) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mockUser', JSON.stringify(data.user));
      }
      return data.user;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch current user from API, checking local session:', err);
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('mockUser');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  }
}

/**
 * Route guard: ensures user is authenticated or redirects
 * @param {string} [redirectUrl]
 */
function requireAuth(redirectUrl = '/') {
  const token = getAuthToken();
  if (!token && typeof window !== 'undefined') {
    window.location.href = redirectUrl;
  }
}

// ----------------------------------------------------
// Content API Calls
// ----------------------------------------------------

/**
 * Register digital content with server
 * @param {FormData | { file: File, title: string, type: string, description: string }} param
 */
async function registerContent(param) {
  let body;
  if (param instanceof FormData) {
    body = param;
  } else {
    body = new FormData();
    if (param.file) body.append('file', param.file);
    if (param.title) body.append('title', param.title);
    if (param.type) body.append('type', param.type);
    if (param.description) body.append('description', param.description);
  }

  const res = await fetch(getApiUrl('/api/content/register'), {
    method: 'POST',
    headers: getAuthHeaders(false),
    body
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to register content.');
  }

  return data.data;
}

/**
 * Get all content for authenticated user
 */
async function getUserContent() {
  const res = await fetch(getApiUrl('/api/content'), {
    headers: getAuthHeaders(true)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch content.');
  }

  return data.data || [];
}

/**
 * Verify a file or hash against the registry
 * @param {string | object} contentIdOrParams
 * @param {string} [sha256Hash]
 */
async function verifyFile(contentIdOrParams, sha256Hash) {
  let payload = {};
  if (typeof contentIdOrParams === 'object') {
    payload = contentIdOrParams;
  } else {
    payload = {
      contentId: contentIdOrParams,
      sha256Hash: sha256Hash
    };
  }

  const res = await fetch(getApiUrl('/api/content/verify'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Verification request failed.');
  }

  return data;
}

// ----------------------------------------------------
// Licenses API Calls
// ----------------------------------------------------

/**
 * Create a new license
 * @param {object} licenseData
 */
async function createLicense(licenseData) {
  const res = await fetch(getApiUrl('/api/licenses'), {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(licenseData)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create license.');
  }

  return data.data;
}

/**
 * Get all licenses for authenticated user
 */
async function getUserLicenses() {
  const res = await fetch(getApiUrl('/api/licenses'), {
    headers: getAuthHeaders(true)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch licenses.');
  }

  return data.data || [];
}

// ----------------------------------------------------
// Disputes API Calls
// ----------------------------------------------------

/**
 * File a dispute
 * @param {object} disputeData
 */
async function fileDispute(disputeData) {
  const res = await fetch(getApiUrl('/api/disputes'), {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(disputeData)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to file dispute.');
  }

  return data.data;
}

/**
 * Get all disputes for authenticated user
 */
async function getUserDisputes() {
  const res = await fetch(getApiUrl('/api/disputes'), {
    headers: getAuthHeaders(true)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch disputes.');
  }

  return data.data || [];
}

// ----------------------------------------------------
// Profile Saver (Form handler)
// ----------------------------------------------------

/**
 * Saves Profile with Strict Input Validation
 * @param {Event | Object} param
 * @returns {boolean} true if saved, false if validation failed
 */
function saveProfile(param) {
  if (param && typeof param.preventDefault === 'function') {
    param.preventDefault();
  }

  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };

  let name, email, phone, username, website, organization, bio;

  if (param && typeof param === 'object' && !param.preventDefault && !param.target) {
    name = param.name !== undefined ? param.name : getVal('profile-name');
    email = param.email !== undefined ? param.email : getVal('profile-email');
    phone = param.phone !== undefined ? param.phone : getVal('profile-phone');
    username = param.username !== undefined ? param.username : getVal('profile-username');
    website = param.website !== undefined ? param.website : (param.url !== undefined ? param.url : getVal('profile-website'));
    organization = param.organization !== undefined ? param.organization : getVal('profile-organization');
    bio = param.bio !== undefined ? param.bio : getVal('profile-bio');
  } else {
    name = getVal('profile-name');
    email = getVal('profile-email');
    phone = getVal('profile-phone');
    username = getVal('profile-username');
    website = getVal('profile-website');
    organization = getVal('profile-organization');
    bio = getVal('profile-bio');
  }

  // 1. Full Name / Creator Pseudonym Validation
  if (!validateName(name)) {
    App.showToast("Please enter a valid name (letters, spaces, hyphens, apostrophes only, min 2 characters).", "error");
    return false;
  }

  // 2. Email Address Validation
  if (!validateEmail(email)) {
    App.showToast("Please enter a valid email address (e.g., user@domain.com).", "error");
    return false;
  }

  // 3. Phone Number Validation
  if (!validatePhone(phone)) {
    App.showToast("Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890).", "error");
    return false;
  }

  // 4. Username / Handle Validation
  if (!validateUsername(username)) {
    App.showToast("Username must be at least 3 characters (letters, numbers, underscores, hyphens only).", "error");
    return false;
  }

  // 5. Website URL Validation
  if (!validateUrl(website)) {
    App.showToast("Please enter a valid URL (e.g., https://example.com).", "error");
    return false;
  }

  // Save to localStorage
  try {
    const storedUser = localStorage.getItem('mockUser');
    let user = storedUser ? JSON.parse(storedUser) : {};
    user.name = name.trim();
    user.email = email.trim();
    user.username = username.trim();
    user.phone = phone ? phone.trim() : '';
    user.website = website ? website.trim() : '';
    user.organization = organization ? organization.trim() : '';
    user.bio = bio ? bio.trim() : '';
    localStorage.setItem('mockUser', JSON.stringify(user));

    const storedUsers = localStorage.getItem('mockUsers');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      const idx = users.findIndex(u => u.id === user.id || u.email === user.email || u.username === user.username);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...user };
        localStorage.setItem('mockUsers', JSON.stringify(users));
      }
    }
  } catch (err) {
    console.error("Storage write error:", err);
  }

  // Sync to Backend if logged in
  const token = getAuthToken();
  if (token) {
    fetch(getApiUrl('/api/auth/profile'), {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        website: website ? website.trim() : '',
        bio: bio ? bio.trim() : ''
      })
    }).catch(err => console.warn('Could not sync profile to backend:', err));
  }

  // Update DOM displays if present
  const nameDisplay = document.getElementById('profile-display-name');
  if (nameDisplay) nameDisplay.textContent = name;
  const usernameDisplay = document.getElementById('profile-display-username');
  if (usernameDisplay) usernameDisplay.textContent = '@' + username;

  App.showToast("Profile updated successfully!", "success");
  return true;
}

// Attach all functions to App namespace
App.validateName = validateName;
App.validateEmail = validateEmail;
App.validatePhone = validatePhone;
App.validateUsername = validateUsername;
App.validateUrl = validateUrl;
App.calculateSHA256 = calculateSHA256;
App.showToast = showToast;
App.saveProfile = saveProfile;
App.signup = signup;
App.login = login;
App.logout = logout;
App.demoLogin = demoLogin;
App.getCurrentUser = getCurrentUser;
App.requireAuth = requireAuth;
App.registerContent = registerContent;
App.getUserContent = getUserContent;
App.verifyFile = verifyFile;
App.createLicense = createLicense;
App.getUserLicenses = getUserLicenses;
App.fileDispute = fileDispute;
App.getUserDisputes = getUserDisputes;

// Expose globally on window if in browser
if (typeof window !== 'undefined') {
  window.validateName = validateName;
  window.validateEmail = validateEmail;
  window.validatePhone = validatePhone;
  window.validateUsername = validateUsername;
  window.validateUrl = validateUrl;
  window.calculateSHA256 = calculateSHA256;
  window.showToast = showToast;
  window.saveProfile = saveProfile;
  window.signup = signup;
  window.login = login;
  window.logout = logout;
  window.demoLogin = demoLogin;
  window.getCurrentUser = getCurrentUser;
  window.requireAuth = requireAuth;
  window.registerContent = registerContent;
  window.getUserContent = getUserContent;
  window.verifyFile = verifyFile;
  window.createLicense = createLicense;
  window.getUserLicenses = getUserLicenses;
  window.fileDispute = fileDispute;
  window.getUserDisputes = getUserDisputes;
}

// Support Node.js / CommonJS testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateName,
    validateEmail,
    validatePhone,
    validateUsername,
    validateUrl,
    calculateSHA256,
    showToast,
    saveProfile,
    signup,
    login,
    logout,
    demoLogin,
    getCurrentUser,
    requireAuth,
    registerContent,
    getUserContent,
    verifyFile,
    createLicense,
    getUserLicenses,
    fileDispute,
    getUserDisputes,
    App
  };
}

// Initialize on DOM load if document is available
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfile(e);
      });
    }

    // Pre-fill fields from stored user if available
    try {
      if (typeof localStorage !== 'undefined') {
        const rawUser = localStorage.getItem('mockUser');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          const nameInput = document.getElementById('profile-name');
          if (nameInput && !nameInput.value && user.name) nameInput.value = user.name;
          const emailInput = document.getElementById('profile-email');
          if (emailInput && !emailInput.value && user.email) emailInput.value = user.email;
          const phoneInput = document.getElementById('profile-phone');
          if (phoneInput && !phoneInput.value && user.phone) phoneInput.value = user.phone;
          const usernameInput = document.getElementById('profile-username');
          if (usernameInput && !usernameInput.value && user.username) usernameInput.value = user.username;
          const websiteInput = document.getElementById('profile-website');
          if (websiteInput && !websiteInput.value && (user.website || user.url)) websiteInput.value = user.website || user.url;
          const orgInput = document.getElementById('profile-organization');
          if (orgInput && !orgInput.value && user.organization) orgInput.value = user.organization;
          const bioInput = document.getElementById('profile-bio');
          if (bioInput && !bioInput.value && user.bio) bioInput.value = user.bio;

          const nameDisplay = document.getElementById('profile-display-name');
          if (nameDisplay && user.name) nameDisplay.textContent = user.name;
          const usernameDisplay = document.getElementById('profile-display-username');
          if (usernameDisplay && user.username) usernameDisplay.textContent = '@' + user.username;
        }
      }
    } catch (e) {
      console.error("Profile prefill error:", e);
    }
  });
}
