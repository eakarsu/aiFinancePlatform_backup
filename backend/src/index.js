require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const path = require('path');

const authRoutes = require('./routes/auth');
const roboAdvisorRoutes = require('./routes/roboAdvisor');
const creditScoringRoutes = require('./routes/creditScoring');
const fraudDetectionRoutes = require('./routes/fraudDetection');
const alertsRoutes = require('./routes/alerts');
const transactionImportRoutes = require('./routes/transactionImport');
const riskAssessmentRoutes = require('./routes/riskAssessment');
const { authenticateToken } = require('./middleware/auth');

const app = express();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be a unique value of at least 32 characters');
}

// Create PostgreSQL connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3002')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed'));
  }
}));
app.use(express.json({ limit: '1mb' }));

// Make prisma available to routes
app.set('prisma', prisma);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/robo-advisor', roboAdvisorRoutes);
app.use('/api/credit-scoring', creditScoringRoutes);
app.use('/api/fraud-detection', fraudDetectionRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/transaction-import', transactionImportRoutes);
app.use('/api/risk-assessment', riskAssessmentRoutes);
app.use('/api/application-ai', require('./routes/applicationAi'));
app.use('/api/migration-path', require('./routes/migrationPath'));
app.use('/api/archive-cleanup', require('./routes/archiveCleanup'));
app.use('/api/snapshot-diff', require('./routes/snapshotDiff'));
app.use('/api/demo-build', require('./routes/demoBuild'));
app.use('/api/restore-readiness', require('./routes/restoreReadiness'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    modules: [
      'robo-advisor',
      'credit-scoring',
      'fraud-detection',
      'alerts',
      'transaction-import',
      'risk-assessment'
    ],
    version: '2.0.0'
  });
});

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '127.0.0.1';

// === Batch 03 Gaps & Frontend Mounts ===
try {
  const _batch03 = require('../routes/batch03Gaps');
  if (typeof authenticateToken === 'function') app.use('/api', authenticateToken, _batch03);
  else app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

const webRoot = path.resolve(__dirname, '../../web');
app.use(express.static(webRoot));
app.get('/', (_req, res) => res.sendFile(path.join(webRoot, 'index.html')));

app.use((err, _req, res, _next) => {
  console.error('Request failed:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`AI Finance Platform running at http://${HOST}:${PORT}`);
  console.log('Modules: Robo-Advisor, Credit Scoring, Fraud Detection');
});
