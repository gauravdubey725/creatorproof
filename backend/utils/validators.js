/**
 * CreatorProof Backend Validation Utilities
 * Enforces strict input hygiene and cryptographic/profile constraints.
 */

/**
 * Validates Full Name / Creator Pseudonym
 * - Must contain ONLY letters, spaces, hyphens, apostrophes, and dots.
 * - Must be at least 2 characters.
 * @param {string} name
 * @returns {boolean}
 */
function validateName(name) {
  if (!name || typeof name !== 'string') return false;
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
  if (!email || typeof email !== 'string') return false;
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
 * Validates Password
 * - Must be at least 6 characters
 * @param {string} password
 * @returns {boolean}
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
}

/**
 * Validates Username / Handle
 * - Must be at least 3 characters.
 * - Must contain ONLY letters, numbers, underscores, and hyphens.
 * @param {string} username
 * @returns {boolean}
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const val = username.trim();
  if (val.length < 3) return false;
  const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/;
  return usernameRegex.test(val);
}

/**
 * Validates Phone Number (Optional field)
 * - Empty string or null is valid.
 * - If provided: E.164 (+1234567890), US format, or 10-15 digits.
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
 * Validates Website URL (Optional field)
 * - Empty string or null is valid.
 * - Must start with http:// or https:// and have valid domain.
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
 * Validates Future Expiry Date for Licenses
 * @param {string} dateString
 * @returns {boolean}
 */
function validateFutureDate(dateString) {
  if (!dateString) return false;
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) return false;
  const now = new Date();
  return parsed > now;
}

module.exports = {
  validateName,
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhone,
  validateUrl,
  validateFutureDate
};
