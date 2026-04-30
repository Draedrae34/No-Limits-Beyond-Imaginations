// api/agent.js - Lil Mystic's brain
import { runCatalogSync, cleanupGibberish, generateNewProducts, runSiteAudit, testEndpoints } from './workshop-product-tools.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { message, toolHint, context } = body;

  try {
    const lower = (message || '').toLowerCase();
    const actions = [];

    // Tool routing
    if (toolHint === 'sync-catalog' || (lower.includes('sync') && lower.includes('catalog'))) {
      actions.push(runCatalogSync);
    }
    if (toolHint === 'cleanup-gibberish' || (lower.includes('clean') && lower.includes('gibberish'))) {
      actions.push(cleanupGibberish);
    }
    if (toolHint === 'generate-new' || (lower.includes('generate') && lower.includes('product'))) {
      actions.push(generateNewProducts);
    }
    if (toolHint === 'audit-site' || lower.includes('audit')) {
      actions.push(runSiteAudit);
    }
    if (toolHint === 'test-endpoints' || (lower.includes('test') && lower.includes('endpoint'))) {
      actions.push(testEndpoints);
    }

    if (!actions.length) {
      return res.json({
        reply: `I heard: "${message}". I'm wired to run tools like catalog sync, gibberish cleanup, product generation, audits, and endpoint tests. Try clicking a tool button or be more specific.`
      });
    }

    const messages = [];
    for (const act of actions) {
      try {
        const out = await act();
        if (typeof out === 'string') {
          messages.push(out);
        } else if (out && typeof out.summary === 'string') {
          messages.push(out.summary);
          if (out.ok === false) messages.push(`( Tool reported failure )`);
        } else {
          messages.push('Tool executed. See server logs for details.');
        }
      } catch (err) {
        console.error('Tool execution error:', err);
        messages.push(`⚠️ Tool failed: ${err.message}`);
      }
    }

    return res.json({ messages });
  } catch (err) {
    console.error('Lil Mystic agent error:', err);
    return res.status(500).json({ error: 'Lil Mystic encountered an error in the void.' });
  }
}
