'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'runtime-ai-fixture-secret-that-is-long-enough';
process.env.OPENROUTER_API_KEY = 'fixture-key';
process.env.OPENROUTER_MODEL = 'fixture/model';
process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const applicationAiRoutes = require('../src/routes/applicationAi');

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
    server.once('error', reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

test('finance advice uses a controlled provider fixture and returns saved history', async () => {
  const nativeFetch = global.fetch;
  const stored = [];
  const providerRequests = [];
  const prisma = {
    runtimeAiResult: {
      async create({ data }) {
        const record = {
          id: 'result-fixture-001',
          ...data,
          createdAt: new Date('2026-10-10T12:00:00.000Z'),
        };
        stored.push(record);
        return record;
      },
      async findMany(query) {
        assert.deepEqual(query.where, { userId: 'user-fixture-001' });
        assert.deepEqual(query.orderBy, { createdAt: 'desc' });
        assert.equal(query.take, 50);
        return stored;
      },
    },
  };

  global.fetch = async (url, options) => {
    providerRequests.push({ url: String(url), body: JSON.parse(options.body) });
    return {
      ok: true,
      async json() {
        return {
          id: 'provider-fixture-001',
          model: 'fixture/model',
          created: 1791633600,
          choices: [{ message: { content: JSON.stringify({
            summary: 'Controlled fixture result',
            recommendations: [
              { action: 'Review cash reserve', priority: 'High' },
              { action: 'Confirm time horizon', priority: 'Medium' },
            ],
          }) } }],
          usage: { prompt_tokens: 40, completion_tokens: 24, total_tokens: 64 },
        };
      },
    };
  };

  const app = express();
  app.use(express.json());
  app.set('prisma', prisma);
  app.use('/api/application-ai', applicationAiRoutes);
  const server = await listen(app);
  const { port } = server.address();
  const token = jwt.sign({ id: 'user-fixture-001', email: 'demo@aifinance.com', role: 'ADMIN' }, process.env.JWT_SECRET);

  try {
    const generatedResponse = await nativeFetch(`http://127.0.0.1:${port}/api/application-ai/finance-advice`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'Controlled fixture prompt' }),
    });
    assert.equal(generatedResponse.status, 200);
    const generated = await generatedResponse.json();
    assert.equal(generated.id, 'result-fixture-001');
    assert.equal(generated.provider, 'openrouter');
    assert.deepEqual(JSON.parse(generated.result).recommendations, [
      { action: 'Review cash reserve', priority: 'High' },
      { action: 'Confirm time horizon', priority: 'Medium' },
    ]);

    assert.equal(providerRequests.length, 1);
    assert.equal(providerRequests[0].url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(providerRequests[0].body.model, 'fixture/model');
    assert.equal(providerRequests[0].body.messages[1].content, 'Controlled fixture prompt');

    const historyResponse = await nativeFetch(`http://127.0.0.1:${port}/api/application-ai/finance-advice/history`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(historyResponse.status, 200);
    const history = await historyResponse.json();
    assert.equal(history.history.length, 1);
    assert.equal(history.history[0].id, generated.id);
    assert.equal(history.history[0].providerReceipt.id, 'provider-fixture-001');
  } finally {
    global.fetch = nativeFetch;
    await close(server);
  }
});
