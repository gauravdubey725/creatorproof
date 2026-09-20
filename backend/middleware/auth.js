const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Validates JWT Bearer tokens from the Authorization header and attaches the user payload to req.user.
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'creatorproof-default-jwt-secret-key-32chars';

    const decoded = jwt.verify(token, secret);

    // Normalize user ID to both .id and .userId for compatibility across handlers
    const userId = decoded.userId || decoded.id || decoded.sub;

    req.user = {
      ...decoded,
      id: userId,
      userId: userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Authentication token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.'
    });
  }
}

module.exports = authMiddleware;
