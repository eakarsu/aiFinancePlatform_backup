// Lightweight demo build: minimal-surface preview environment indicator.
const express = require('express');
const router = express.Router();

// GET /api/demo-build/info
router.get('/info', (_req, res) => {
  return res.json({
    role: 'demo_preview',
    enabled_routes: ['/api/auth', '/api/robo-advisor', '/api/credit-scoring', '/api/fraud-detection', '/api/alerts'],
    notice: 'This is a frozen demo snapshot of aiFinancePlatform_backup. For production use, switch to aiFinancePlatform main.',
    bundle_size_estimate: 'small (< 5 modules)',
  });
});

module.exports = router;
