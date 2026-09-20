const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const supabaseService = require('../services/supabase');
const { validateFutureDate, validateEmail } = require('../utils/validators');

/**
 * POST /api/licenses
 * Issues a new commercial or creative license for an authenticated user's content
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contentId, licensee, licenseeEmail, type, expiryDate, permissions } = req.body;

    // 1. Validations
    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'contentId is required to issue a license.'
      });
    }

    if (!licensee || licensee.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Licensee entity or person name is required.'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'License type (e.g., Commercial, Editorial, Exclusive) is required.'
      });
    }

    if (!expiryDate || !validateFutureDate(expiryDate)) {
      return res.status(400).json({
        success: false,
        error: 'A valid future expiry date is required.'
      });
    }

    if (licenseeEmail && !validateEmail(licenseeEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid licensee email format.'
      });
    }

    // 2. Verify content ownership
    const content = await supabaseService.findContentByContentIdOrHash(contentId, null);
    if (!content) {
      return res.status(404).json({
        success: false,
        error: `Content with ID "${contentId}" does not exist.`
      });
    }

    if (content.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this content piece and cannot issue licenses for it.'
      });
    }

    // 3. Insert license into Supabase
    const license = await supabaseService.insertLicense({
      userId: req.user.id,
      contentId: content.id,
      licensee: licensee.trim(),
      licenseeEmail: licenseeEmail ? licenseeEmail.trim().toLowerCase() : null,
      type: type.trim(),
      expiryDate: expiryDate,
      permissions: permissions ? permissions.trim() : '',
      status: 'Active'
    });

    return res.status(201).json({
      success: true,
      data: {
        id: license.id,
        contentId: content.content_id || content.id,
        contentTitle: content.title,
        licensee: license.licensee,
        licenseeEmail: license.licensee_email,
        type: license.type,
        expiryDate: license.expiry_date,
        permissions: license.permissions,
        status: license.status,
        createdAt: license.created_at
      }
    });
  } catch (error) {
    console.error('[Licenses Route] Create error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to issue license.'
    });
  }
});

/**
 * GET /api/licenses
 * Retrieves all licenses created by or associated with the authenticated user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await supabaseService.getUserLicenses(req.user.id);

    const formatted = list.map((item) => ({
      id: item.id,
      contentId: item.content ? (item.content.content_id || item.content_id) : item.content_id,
      contentTitle: item.content ? item.content.title : 'Registered Work',
      licensee: item.licensee,
      licenseeEmail: item.licensee_email,
      type: item.type,
      expiryDate: item.expiry_date,
      permissions: item.permissions,
      status: item.status,
      createdAt: item.created_at
    }));

    return res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('[Licenses Route] List error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve licenses.'
    });
  }
});

/**
 * PATCH /api/licenses/:id/status
 * Updates the status of a license (e.g., Revoked, Expired, Active)
 */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required.'
      });
    }

    const updated = await supabaseService.updateLicenseStatus(req.params.id, req.user.id, status);
    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[Licenses Route] Update status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update license status.'
    });
  }
});

/**
 * DELETE /api/licenses/:id
 * Deletes a license created by the authenticated user
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await supabaseService.deleteLicense(req.params.id, req.user.id);
    return res.json({
      success: true,
      message: 'License deleted successfully.'
    });
  } catch (error) {
    console.error('[Licenses Route] Delete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete license.'
    });
  }
});

module.exports = router;
