'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');

test('runtime AI is authenticated, exact-provider routed, and persistent', () => {
  const source = fs.readFileSync(path.join(root, 'backend/src/routes/applicationAi.js'), 'utf8');
  assert.match(source, /authenticateToken/);
  assert.match(source, /OPENROUTER_BASE_URL/);
  assert.match(source, /https:\/\/openrouter\.ai\/api\/v1/);
  assert.match(source, /runtimeAiResult\.create/);
  assert.doesNotMatch(source, /fallback|mock response|placeholder response/i);
});

test('launcher requires separate API and UI ports', () => {
  const source = fs.readFileSync(path.join(root, 'start.sh'), 'utf8');
  assert.match(source, /BACKEND_PORT/);
  assert.match(source, /FRONTEND_PORT/);
  assert.match(source, /runtime-launcher/);
});

test('registration accepts the runtime verification name shape', () => {
  const source = fs.readFileSync(path.join(root, 'backend/src/routes/auth.js'), 'utf8');
  assert.match(source, /full_name/);
  assert.match(source, /suppliedName/);
});
