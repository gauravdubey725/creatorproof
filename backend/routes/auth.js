const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const supabaseService = require('../services/supabase');
const authMiddleware = require('../middleware/auth');
const {
  validateEmail,
  validatePassword,
  validateUsername,
  validateName,
  validatePhone,
  validateUrl
} = require('../utils/validators');

const JWT_SECRET = process.env.JWT_SECRET || 'creatorproof-default-jwt-secret-key-32chars';
const TOKEN_EXPIRY = '7d';

/**
 * POST /api/auth/signup
 * Registers a new creator account
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, username, phone, website, bio } = req.body;

    // 1. Input validations
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format (e.g. user@domain.com).'
      });
    }

    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters.'
      });
    }

    if (!username || !validateUsername(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters and contain only letters, numbers, underscores, and hyphens.'
      });
    }

    if (name && !validateName(name)) {
      return res.status(400).json({
        success: false,
        error: 'Name must contain only letters, spaces, hyphens, and apostrophes (min 2 characters).'
      });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format.'
      });
    }

    if (website && !validateUrl(website)) {
      return res.status(400).json({
        success: false,
        error: 'Website must start with http:// or https:// and be a valid URL.'
      });
    }

    // 2. Check if email or username already exists
    const existingByEmail = await supabaseService.getUserByEmail(email);
    if (existingByEmail) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.'
      });
    }

    const existingByUsername = await supabaseService.getUserByUsername(username);
    if (existingByUsername) {
      return res.status(409).json({
        success: false,
        error: 'An account with this username already exists. Please choose another.'
      });
    }

    // 3. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Generate wallet address
    const randomHex = crypto.randomBytes(20).toString('hex');
    const walletAddress = `0x${randomHex}`;

    // 5. Insert into users table
    const newUser = await supabaseService.createUser({
      email,
      passwordHash,
      name: name || username,
      username,
      walletAddress,
      phone,
      website,
      bio
    });

    // 6. Sign JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
        wallet_address: newUser.wallet_address,
        created_at: newUser.created_at
      }
    });
  } catch (error) {
    console.error('[Auth Route] Signup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during registration.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user by email/username and returns a JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginIdentifier = (email || username || identifier || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/username and password are required.'
      });
    }

    // Lookup user by email or username
    let user = null;
    if (loginIdentifier.includes('@')) {
      user = await supabaseService.getUserByEmail(loginIdentifier);
    } else {
      user = await supabaseService.getUserByUsername(loginIdentifier);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Sign JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Exclude password_hash from response
    const { password_hash, ...userProfile } = user;

    return res.json({
      success: true,
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('[Auth Route] Login error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during login.'
    });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current user profile from token
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await supabaseService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found.'
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('[Auth Route] /me error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error retrieving user profile.'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Updates profile information for authenticated user
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, website, bio } = req.body;

    if (name && !validateName(name)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid name format.'
      });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone format.'
      });
    }

    if (website && !validateUrl(website)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid website URL format.'
      });
    }

    const updated = await supabaseService.updateUser(req.user.id, {
      name,
      phone,
      website,
      bio
    });

    return res.json({
      success: true,
      user: updated
    });
  } catch (error) {
    console.error('[Auth Route] Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile.'
    });
  }
});

module.exports = router;
