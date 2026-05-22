const router = require('express').Router();

router.post('/score', (req, res) => {
  const { lastBackupHours = 0, failedJobs = 0, restoreDrillDays = 0, checksumMismatches = 0 } = req.body || {};
  const score = Math.min(100, Math.round(
    Math.max(0, Number(lastBackupHours) - 24) * 2 +
    Number(failedJobs) * 18 +
    Math.max(0, Number(restoreDrillDays) - 30) * 0.8 +
    Number(checksumMismatches) * 25
  ));
  res.json({
    feature: 'restore_readiness',
    score,
    level: score >= 70 ? 'not-ready' : score >= 35 ? 'verify' : 'ready',
    actions: [
      Number(failedJobs) > 0 && 'Rerun failed backup jobs before next release.',
      Number(restoreDrillDays) > 30 && 'Schedule a restore drill.',
      Number(checksumMismatches) > 0 && 'Quarantine mismatched archive snapshots.',
    ].filter(Boolean),
  });
});

module.exports = router;
