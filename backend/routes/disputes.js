const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const supabaseService = require('../services/supabase');
const { validateEmail } = require('../utils/validators');

/**
 * POST /api/disputes
 * Files a new copyright or ownership dispute against a content piece
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contentId, claimant, claimantEmail, type, description, evidence } = req.body;

    // 1. Validations
    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'contentId is required to file a dispute.'
      });
    }

    if (!claimant || claimant.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Claimant name is required.'
      });
    }

    if (!type || type.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Dispute category/type is required (e.g., Copyright Infringement, Plagiarism).'
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Dispute description and detailed claim rationale are required.'
      });
    }

    if (claimantEmail && !validateEmail(claimantEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid claimant email address format.'
      });
    }

    // 2. Resolve content record
    const content = await supabaseService.findContentByContentIdOrHash(contentId, null);
    if (!content) {
      return res.status(404).json({
        success: false,
        error: `Target content item with ID "${contentId}" could not be located.`
      });
    }

    // 3. Insert dispute record
    const dispute = await supabaseService.insertDispute({
      userId: req.user.id,
      contentId: content.id,
      claimant: claimant.trim(),
      claimantEmail: claimantEmail ? claimantEmail.trim().toLowerCase() : null,
      type: type.trim(),
      description: description.trim(),
      evidence: evidence ? evidence.trim() : '',
      status: 'Under Review'
    });

    return res.status(201).json({
      success: true,
      data: {
        id: dispute.id,
        contentId: content.content_id || content.id,
        contentTitle: content.title,
        claimant: dispute.claimant,
        claimantEmail: dispute.claimant_email,
        type: dispute.type,
        description: dispute.description,
        evidence: dispute.evidence,
        status: dispute.status,
        createdAt: dispute.created_at
      }
    });
  } catch (error) {
    console.error('[Disputes Route] File dispute error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to file dispute.'
    });
  }
});

/**
 * GET /api/disputes
 * Retrieves all disputes associated with the authenticated user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await supabaseService.getUserDisputes(req.user.id);

    const formatted = list.map((item) => ({
      id: item.id,
      contentId: item.content ? (item.content.content_id || item.content_id) : item.content_id,
      contentTitle: item.content ? item.content.title : 'Registered Work',
      claimant: item.claimant,
      claimantEmail: item.claimant_email,
      type: item.type,
      description: item.description,
      evidence: item.evidence,
      status: item.status,
      createdAt: item.created_at
    }));

    return res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('[Disputes Route] List error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve disputes.'
    });
  }
});

/**
 * PATCH /api/disputes/:id/status
 * Updates the status and/or resolution notes of a dispute
 */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required.'
      });
    }

    const updated = await supabaseService.updateDisputeStatus(
      req.params.id,
      req.user.id,
      status,
      resolutionNotes
    );

    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[Disputes Route] Update status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update dispute status.'
    });
  }
});

/**
 * DELETE /api/disputes/:id
 * Deletes a dispute record
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await supabaseService.deleteDispute(req.params.id, req.user.id);
    return res.json({
      success: true,
      message: 'Dispute deleted successfully.'
    });
  } catch (error) {
    console.error('[Disputes Route] Delete error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete dispute.'
    });
  }
});

module.exports = router;
