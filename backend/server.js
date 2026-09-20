const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env or parent .env
const envPath = path.resolve(__dirname, '.env');
const parentEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else if (fs.existsSync(parentEnvPath)) {
  require('dotenv').config({ path: parentEnvPath });
} else {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const licensesRoutes = require('./routes/licenses');
const disputesRoutes = require('./routes/disputes');

// Import services for health status
const supabaseService = require('./services/supabase');
const blockchainService = require('./services/blockchain');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// Health Check API (supports both /health and /api/health)
const handleHealth = (req, res) => {
  let supabaseStatus = 'unconfigured';
  try {
    supabaseService.getClient();
    supabaseStatus = 'configured';
  } catch (e) {
    supabaseStatus = 'unconfigured';
  }

  res.json({
    status: 'ok',
    app: 'CreatorProof Backend API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      supabase: supabaseStatus,
      blockchain: blockchainService.isReady() ? 'configured' : 'standby/local_mode'
    }
  });
};

// API Router definition
const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CreatorProof API is running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      content: '/api/content',
      licenses: '/api/licenses',
      disputes: '/api/disputes'
    }
  });
});

apiRouter.get('/health', handleHealth);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/content', contentRoutes);
apiRouter.use('/licenses', licensesRoutes);
apiRouter.use('/disputes', disputesRoutes);

// Mount API router and top-level health
app.use('/api', apiRouter);
app.get('/health', handleHealth);

// Static assets serving
const publicDir = path.resolve(__dirname, 'public');
const parentPublicDir = path.resolve(__dirname, '../public');
const distDir = path.resolve(__dirname, '../dist');

app.use(express.static(publicDir));
if (fs.existsSync(parentPublicDir)) {
  app.use(express.static(parentPublicDir));
}
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Serve index.html at root
app.get('/', (req, res) => {
  if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    return res.sendFile(path.join(publicDir, 'index.html'));
  }
  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    return res.sendFile(path.join(distDir, 'index.html'));
  }
  res.sendFile(path.join(publicDir, 'standalone.html'));
});

// Standalone and Profile routes
app.get('/standalone', (req, res) => {
  res.sendFile(path.join(publicDir, 'standalone.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(publicDir, 'profile.html'));
});

// Catch-all for SPA client routing (excluding API routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') return next();
  if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    return res.sendFile(path.join(publicDir, 'index.html'));
  }
  next();
});

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route "${req.method} ${req.originalUrl}" not found.`
  });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start Server if executed directly
if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    let supabaseStatus = 'unconfigured';
    try {
      supabaseService.getClient();
      supabaseStatus = 'configured';
      const storageService = require('./services/storage');
      storageService.ensureBucketExists().catch(() => {});
    } catch (e) {
      supabaseStatus = 'unconfigured';
    }

    const rpcUrl = process.env.SEPOLIA_RPC_URL || '';
    const rpcStatus = rpcUrl && !rpcUrl.includes('your-api-key') && !rpcUrl.includes('YOUR_PROJECT_ID')
      ? 'configured'
      : (process.env.SEPOLIA_RPC_URL ? 'configured (public node)' : 'standby');
    const contractAddr = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

    console.log('\n====================================');
    console.log('CREATORPROOF BACKEND SERVER');
    console.log('====================================');
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`Supabase: ${supabaseStatus}`);
    console.log(`Sepolia RPC: ${rpcStatus}`);
    console.log(`Contract: ${contractAddr}`);
    console.log('====================================\n');
  });
}

module.exports = app;
module.exports.app = app;
module.exports.apiRouter = apiRouter;
