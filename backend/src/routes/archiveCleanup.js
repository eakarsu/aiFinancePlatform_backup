// Archive cleanup: either resurrect with feature parity or formally deprecate.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const ARCHIVE_STATUS = {
  archived_at: null,
  deprecated: false,
  deprecation_notice: null,
};

// POST /api/archive-cleanup/deprecate { reason }
router.post('/deprecate', authenticateToken, (req, res) => {
  const { reason = 'Replaced by aiFinancePlatform (main)' } = req.body || {};
  ARCHIVE_STATUS.deprecated = true;
  ARCHIVE_STATUS.archived_at = new Date().toISOString();
  ARCHIVE_STATUS.deprecation_notice = reason;
  return res.json({ status: ARCHIVE_STATUS });
});

// GET /api/archive-cleanup/status
router.get('/status', (_req, res) => res.json({ status: ARCHIVE_STATUS }));

module.exports = router;
