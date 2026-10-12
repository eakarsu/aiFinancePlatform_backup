'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const authRoutes = require('../src/routes/auth');

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
    server.once('error', reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

test('demo credentials use the existing demo account and retain the production gate', async () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    DEMO_EMAIL: process.env.DEMO_EMAIL,
    DEMO_PASSWORD: process.env.DEMO_PASSWORD,
    DEMO_SEED_PASSWORD: process.env.DEMO_SEED_PASSWORD,
    ENABLE_DEMO_CREDENTIAL_AUTOFILL: process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL,
  };
  process.env.NODE_ENV = 'test';
  delete process.env.DEMO_EMAIL;
  delete process.env.DEMO_PASSWORD;
  process.env.DEMO_SEED_PASSWORD = 'fixture-demo-password';
  delete process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL;

  const app = express();
  app.use('/api/auth', authRoutes);
  const server = await listen(app);
  const { port } = server.address();

  try {
    const available = await fetch(`http://127.0.0.1:${port}/api/auth/demo-credentials`);
    assert.equal(available.status, 200);
    assert.equal(available.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await available.json(), {
      email: 'demo@aifinance.com',
      password: 'fixture-demo-password',
    });

    process.env.NODE_ENV = 'production';
    const gated = await fetch(`http://127.0.0.1:${port}/api/auth/demo-credentials`);
    assert.equal(gated.status, 404);
  } finally {
    await close(server);
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
