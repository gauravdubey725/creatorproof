const crypto = require('crypto');

/**
 * Calculates cryptographic SHA-256 hash of a Buffer or string.
 * @param {Buffer | string} input
 * @returns {string} 64-character lowercase hex string
 */
function calculateSHA256(input) {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}

/**
 * Calculates cryptographic SHA-256 hash from a readable stream.
 * @param {import('stream').Readable} stream
 * @returns {Promise<string>}
 */
function calculateStreamSHA256(stream) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

/**
 * Generates a standard CreatorProof Content ID (e.g., CP-9821A4B0)
 * @returns {string}
 */
function generateContentId() {
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CP-${randomSuffix}`;
}

/**
 * Helper to format file sizes nicely
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  calculateSHA256,
  calculateStreamSHA256,
  generateContentId,
  formatBytes
};
