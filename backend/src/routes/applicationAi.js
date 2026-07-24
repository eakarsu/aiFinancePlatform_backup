const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/finance-advice', async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = process.env.OPENROUTER_BASE_URL;
  if (!apiKey || !model || baseUrl !== 'https://openrouter.ai/api/v1') {
    return res.status(503).json({ error: 'OpenRouter configuration is incomplete' });
  }

  try {
    const providerResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          { role: 'system', content: 'You are a bounded finance operations assistant. Do not execute trades or make autonomous credit decisions. Require deterministic limits, licensed data, human approval, reconciliation, provenance, and explicit uncertainty.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!providerResponse.ok) throw new Error(`OpenRouter returned ${providerResponse.status}`);
    const payload = await providerResponse.json();
    const result = payload?.choices?.[0]?.message?.content;
    if (typeof result !== 'string' || !result.trim()) throw new Error('OpenRouter returned no substantive content');

    const prisma = req.app.get('prisma');
    const saved = await prisma.runtimeAiResult.create({
      data: {
        userId: req.user.id,
        prompt,
        model: String(payload.model || model),
        providerReceipt: { id: String(payload.id || ''), provider: 'openrouter', created: payload.created ?? null },
        result: result.trim(),
        usage: payload.usage || undefined,
      },
    });
    return res.json({ id: saved.id, provider: 'openrouter', model: saved.model, result: saved.result, usage: saved.usage });
  } catch (error) {
    console.error('OpenRouter request failed', error.message);
    return res.status(502).json({ error: 'OpenRouter request failed' });
  }
});

module.exports = router;
