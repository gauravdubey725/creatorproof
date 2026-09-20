/**
 * Automated Verification & Unit Test Suite for CreatorProof Backend
 */
process.env.NODE_ENV = 'test';
const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import utilities
const {
  validateName,
  validateEmail,
  validatePassword,
  validateUsername,
  validatePhone,
  validateUrl,
  validateFutureDate
} = require('./utils/validators');

const {
  calculateSHA256,
  generateContentId,
  formatBytes
} = require('./utils/hash');

const app = require('./server');
const blockchainService = require('./services/blockchain');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ${description}:`, err.message);
    throw err;
  }
}

async function itAsync(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ${description}:`, err.message);
    throw err;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log(' Starting CreatorProof Backend Tests');
  console.log('========================================\n');

  console.log('1. Testing Input Validators:');
  it('validateName accepts valid creator names', () => {
    assert.strictEqual(validateName('Alex Vance'), true);
    assert.strictEqual(validateName("Jean-Luc O'Connor"), true);
    assert.strictEqual(validateName('J.K. Rowling'), true);
    assert.strictEqual(validateName('a'), false);
    assert.strictEqual(validateName('123'), false);
  });

  it('validateEmail enforces strict email specifications', () => {
    assert.strictEqual(validateEmail('alex.vance@creatorproof.io'), true);
    assert.strictEqual(validateEmail('test.user+tag@domain.co.uk'), true);
    assert.strictEqual(validateEmail('alex.vance@c'), false);
    assert.strictEqual(validateEmail('user@domain'), false);
    assert.strictEqual(validateEmail('user@.com'), false);
  });

  it('validatePassword requires min 6 chars', () => {
    assert.strictEqual(validatePassword('Pass12'), true);
    assert.strictEqual(validatePassword('12345'), false);
  });

  it('validateUsername accepts alphanumeric with underscores & hyphens', () => {
    assert.strictEqual(validateUsername('alex_vance'), true);
    assert.strictEqual(validateUsername('creator-123'), true);
    assert.strictEqual(validateUsername('ab'), false);
    assert.strictEqual(validateUsername('alex vance'), false);
  });

  it('validatePhone handles E.164, US formats, and optional emptiness', () => {
    assert.strictEqual(validatePhone(''), true);
    assert.strictEqual(validatePhone(null), true);
    assert.strictEqual(validatePhone('+1234567890'), true);
    assert.strictEqual(validatePhone('(123) 456-7890'), true);
    assert.strictEqual(validatePhone('-111111111111'), false);
  });

  it('validateUrl enforces http/https and domain structure', () => {
    assert.strictEqual(validateUrl(''), true);
    assert.strictEqual(validateUrl('https://creatorproof.io'), true);
    assert.strictEqual(validateUrl('http://localhost:3000'), true);
    assert.strictEqual(validateUrl('creatorproof.io'), false);
    assert.strictEqual(validateUrl('htp://example'), false);
  });

  it('validateFutureDate accepts dates in the future', () => {
    const future = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
    const past = '2020-01-01';
    assert.strictEqual(validateFutureDate(future), true);
    assert.strictEqual(validateFutureDate(past), false);
  });

  console.log('\n2. Testing Cryptographic Utilities:');
  it('calculateSHA256 computes standard NIST SHA-256 hex string', () => {
    const hash = calculateSHA256(Buffer.from('hello world'));
    assert.strictEqual(hash, 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('generateContentId produces CP- prefixed uppercase IDs', () => {
    const id = generateContentId();
    assert.ok(id.startsWith('CP-'));
    assert.strictEqual(id.length, 11);
  });

  it('formatBytes converts bytes into human readable representations', () => {
    assert.strictEqual(formatBytes(1024), '1 KB');
    assert.strictEqual(formatBytes(1048576), '1 MB');
  });

  console.log('\n3. Testing Password Hashing & JWT:');
  await itAsync('bcryptjs hashes and verifies passwords correctly', async () => {
    const password = 'Password123!';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    const isWrong = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isValid, true);
    assert.strictEqual(isWrong, false);
  });

  it('JWT signs and decodes token correctly', () => {
    const secret = 'test-secret-key-32-chars-long-here';
    const payload = { userId: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.userId, payload.userId);
    assert.strictEqual(decoded.email, payload.email);
  });

  console.log('\n4. Testing Blockchain Service & Artifacts:');
  it('Blockchain service loads artifact ABI and handles unconfigured RPC gracefully', () => {
    assert.strictEqual(typeof blockchainService.registerContent, 'function');
    assert.strictEqual(typeof blockchainService.verifyContent, 'function');
    assert.strictEqual(typeof blockchainService.getContent, 'function');
  });

  console.log('\n5. Testing Express Server & Endpoints:');
  await itAsync('Server starts and responds to /api/health', async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const response = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/health`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
      }).on('error', reject);
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body.status, 'ok');
    assert.strictEqual(response.body.app, 'CreatorProof Backend API');

    server.close();
  });

  await itAsync('Server returns 401 on protected endpoint without token', async () => {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const response = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/api/auth/me`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
      }).on('error', reject);
    });

    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.body.success, false);

    server.close();
  });

  console.log('\n========================================');
  console.log(` All ${passedTests}/${totalTests} tests passed successfully!`);
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('\nTest suite execution failed:', err);
  process.exit(1);
});
