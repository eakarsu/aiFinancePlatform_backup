// Snapshot diff visualiser: compare backup vs main for regression tracking.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const BACKUP = {
  ai_endpoints: 0, routes: 7, has_plaid: false, has_portfolio: false, has_retirement: false, has_stock_screener: false,
};
const MAIN = {
  ai_endpoints: 16, routes: 21, has_plaid: true, has_portfolio: true, has_retirement: true, has_stock_screener: true,
};

// GET /api/snapshot-diff
router.get('/', authenticateToken, (_req, res) => {
  const diff = {};
  for (const k of Object.keys(MAIN)) diff[k] = { backup: BACKUP[k], main: MAIN[k], regression: MAIN[k] && !BACKUP[k] };
  const regressions = Object.entries(diff).filter(([_, v]) => v.regression).map(([k]) => k);
  return res.json({ diff, regression_count: regressions.length, regressions });
});

module.exports = router;
