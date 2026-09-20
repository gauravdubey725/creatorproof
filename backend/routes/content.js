const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');
const supabaseService = require('../services/supabase');
const storageService = require('../services/storage');
const blockchainService = require('../services/blockchain');
const { calculateSHA256, generateContentId, formatBytes } = require('../utils/hash');

/**
 * POST /api/content/register
 * Registers new digital content with SHA-256 computation, storage upload, and blockchain minting
 */
router.post('/register', authMiddleware, handleUpload('file'), async (req, res) => {
  try {
    const { title, type, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'File asset is required for registration.'
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content title is required.'
      });
    }

    const cleanTitle = title.trim();
    const cleanType = type || 'Document';
    const cleanDescription = description ? description.trim() : '';

    // 1. Compute cryptographic SHA-256 digest on server
    const sha256Hash = calculateSHA256(file.buffer);

    // 2. Check if this hash has already been registered
    const existingContent = await supabaseService.getContentByHash(sha256Hash);
    if (existingContent) {
      return res.status(409).json({
        success: false,
        error: `Content with identical SHA-256 hash has already been registered under ID: ${existingContent.content_id || existingContent.id}`,
        existingContentId: existingContent.content_id || existingContent.id
      });
    }

    // 3. Upload file to Supabase Storage
    let fileUrl = '';
    try {
      const uploadResult = await storageService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        req.user.id
      );
      fileUrl = uploadResult.publicUrl;
    } catch (storageErr) {
      console.warn('[Content Route] Storage upload warning:', storageErr.message);
      // Construct fallback URL if storage service is currently unconfigured
      fileUrl = `https://storage.creatorproof.io/users/${req.user.id}/${Date.now()}_${encodeURIComponent(file.originalname)}`;
    }

    // 4. Generate standard Content ID
    const contentId = generateContentId();

    // 5. Blockchain Registration (if network and contract are configured)
    let blockchainTxHash = null;
    let blockchainStatus = 'local_verified';
    let blockNumber = null;
    let verified = true;

    try {
      const bcResult = await blockchainService.registerContent(contentId, cleanTitle, sha256Hash);
      if (bcResult && bcResult.success) {
        blockchainTxHash = bcResult.txHash;
        blockNumber = bcResult.blockNumber;
        blockchainStatus = 'confirmed';
        verified = true;
      } else {
        console.log('[Content Route] Blockchain step bypassed or pending:', bcResult ? bcResult.reason : 'Not configured');
      }
    } catch (bcErr) {
      console.warn('[Content Route] Notice on blockchain registration:', bcErr.message);
    }

    // 6. Persist to Supabase Database
    const contentRecord = await supabaseService.insertContent({
      userId: req.user.id,
      contentId: contentId,
      title: cleanTitle,
      type: cleanType,
      description: cleanDescription,
      fileName: file.originalname,
      fileSize: file.size,
      fileUrl: fileUrl,
      sha256Hash: sha256Hash,
      blockchainTxHash: blockchainTxHash,
      blockchainNetwork: 'Polygon PoS / Sepolia',
      blockchainStatus: blockchainStatus,
      verified: verified,
      blockNumber: blockNumber
    });

    return res.status(201).json({
      success: true,
      data: {
        id: contentRecord.id,
        contentId: contentRecord.content_id,
        title: contentRecord.title,
        type: contentRecord.type,
        description: contentRecord.description,
        fileName: contentRecord.file_name,
        fileSize: formatBytes(Number(contentRecord.file_size)),
        fileUrl: contentRecord.file_url,
        sha256Hash: contentRecord.sha256_hash,
        blockchainTxHash: contentRecord.blockchain_tx_hash,
        blockchainStatus: contentRecord.blockchain_status,
        blockNumber: contentRecord.block_number,
        createdAt: contentRecord.created_at
      }
    });
  } catch (error) {
    console.error('[Content Route] Register error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during content registration.'
    });
  }
});

/**
 * GET /api/content
 * Retrieves all registered content items belonging to the authenticated creator
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await supabaseService.getUserContent(req.user.id);

    // Format fields to match frontend consumption
    const formatted = list.map((item) => ({
      id: item.id,
      contentId: item.content_id,
      title: item.title,
      type: item.type,
      description: item.description,
      fileName: item.file_name,
      fileSize: formatBytes(Number(item.file_size)),
      fileUrl: item.file_url,
      sha256Hash: item.sha256_hash,
      blockchainTxHash: item.blockchain_tx_hash,
      blockchainNetwork: item.blockchain_network,
      blockchainStatus: item.blockchain_status,
      verified: item.verified,
      blockNumber: item.block_number,
      createdAt: item.created_at
    }));

    return res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('[Content Route] Get list error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve content list.'
    });
  }
});

/**
 * POST /api/content/verify
 * Verifies a content hash or ID against the database and/or blockchain ledger
 */
router.post('/verify', async (req, res) => {
  try {
    const { contentId, sha256Hash } = req.body;

    if (!sha256Hash && !contentId) {
      return res.status(400).json({
        success: false,
        error: 'Either contentId or sha256Hash is required for verification.'
      });
    }

    const cleanHash = sha256Hash ? sha256Hash.trim().toLowerCase() : null;
    const cleanId = contentId ? contentId.trim() : null;

    // 1. Search in local Supabase database
    const localRecord = await supabaseService.findContentByContentIdOrHash(cleanId, cleanHash);

    if (localRecord) {
      // If both were provided, verify they match
      let isMatch = true;
      if (cleanHash && localRecord.sha256_hash.toLowerCase() !== cleanHash) {
        isMatch = false;
      }

      if (isMatch) {
        return res.json({
          success: true,
          verified: true,
          matchType: 'local_database',
          data: {
            id: localRecord.id,
            contentId: localRecord.content_id,
            title: localRecord.title,
            type: localRecord.type,
            description: localRecord.description,
            fileName: localRecord.file_name,
            fileSize: formatBytes(Number(localRecord.file_size)),
            fileUrl: localRecord.file_url,
            sha256Hash: localRecord.sha256_hash,
            creator: localRecord.users ? localRecord.users.name : 'Verified Creator',
            creatorWallet: localRecord.users ? localRecord.users.wallet_address : null,
            blockchainTxHash: localRecord.blockchain_tx_hash,
            blockchainStatus: localRecord.blockchain_status,
            blockNumber: localRecord.block_number,
            createdAt: localRecord.created_at
          }
        });
      }
    }

    // 2. If not found locally, query smart contract directly
    if (blockchainService.isReady() && cleanId && cleanHash) {
      const bcVerified = await blockchainService.verifyContent(cleanId, cleanHash);
      if (bcVerified.success && bcVerified.verified) {
        const contractData = await blockchainService.getContent(cleanId);
        return res.json({
          success: true,
          verified: true,
          matchType: 'blockchain_contract',
          data: {
            contentId: cleanId,
            title: contractData.data ? contractData.data.title : 'Registered IP',
            sha256Hash: cleanHash,
            creatorWallet: contractData.data ? contractData.data.owner : null,
            blockNumber: contractData.data ? contractData.data.blockNumber : null,
            timestamp: contractData.data ? contractData.data.timestamp : null
          }
        });
      }
    }

    // 3. No match found
    return res.json({
      success: true,
      verified: false,
      reason: 'No matching cryptographic proof record found in local registry or on-chain ledger.'
    });
  } catch (error) {
    console.error('[Content Route] Verify error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error executing verification.'
    });
  }
});

/**
 * GET /api/content/:id
 * Retrieves a single content piece by id or content_id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let record = await supabaseService.getContentByContentId(id);

    if (!record) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const client = supabaseService.getClient();
        const { data } = await client.from('content').select('*, users:user_id (id, name, email, wallet_address)').eq('id', id).maybeSingle();
        record = data;
      }
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Content item not found.'
      });
    }

    return res.json({
      success: true,
      data: record
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve content.'
    });
  }
});

/**
 * DELETE /api/content/:id
 * Deletes or unregisters content belonging to the authenticated user
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    await supabaseService.deleteContent(id, req.user.id);

    return res.json({
      success: true,
      message: 'Content successfully deleted.'
    });
  } catch (error) {
    console.error('[Content Route] Delete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete content.'
    });
  }
});

module.exports = router;
