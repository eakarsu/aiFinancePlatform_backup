// Migration path: diff against main branch and surface AI endpoints to port.
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const MAIN_AI_ENDPOINTS = [
  '/api/ai/tax-loss-harvest', '/api/ai/asset-allocation', '/api/ai/rebalancing-suggest',
  '/api/ai/budget-optimize', '/api/ai/stock-recommend', '/api/ai/insurance-recommend',
  '/api/ai/retirement-project', '/api/ai/fraud-detect', '/api/ai/bill-negotiate',
  '/api/ai/credit-action-plan', '/api/ai/crypto-strategy', '/api/ai/loan-advisor',
  '/api/ai/market-sentiment', '/api/ai/risk-explain', '/api/ai/robo-advice', '/api/ai/goal-coach',
];

const BACKUP_AI_ENDPOINTS = []; // none in this snapshot

// GET /api/migration-path/diff
router.get('/diff', authenticateToken, (_req, res) => {
  const missing = MAIN_AI_ENDPOINTS.filter(e => !BACKUP_AI_ENDPOINTS.includes(e));
  return res.json({ backup_endpoints: BACKUP_AI_ENDPOINTS, main_endpoints: MAIN_AI_ENDPOINTS, missing, action: 'port_missing' });
});

module.exports = router;
