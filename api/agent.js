// api/agent.js - Lil Mystic's brain with intent parser + sequence runner
import { runCatalogSync, cleanupGibberish, generateNewProducts, runSiteAudit, testEndpoints } from './workshop-product-tools.js';

const INTENTS = [
  { keys: ['sync', 'catalog'], name: 'Sync Printify catalog', fn: runCatalogSync },
  { keys: ['clean', 'gibberish', 'cleanup', 'junk'], name: 'Clean gibberish products', fn: cleanupGibberish },
  { keys: ['generate', 'create', 'build', 'new product', 'cosmic'], name: 'Generate new cosmic products', fn: generateNewProducts },
  { keys: ['audit', 'check', 'health', 'status'], name: 'Run full site audit', fn: runSiteAudit },
  { keys: ['test', 'endpoint', 'ping', 'api'], name: 'Test API endpoints', fn: testEndpoints },
];

function parseIntent(message, toolHint) {
  const steps = [];

  if (toolHint) {
    const mapped = INTENTS.find(i => i.keys.includes(toolHint));
    if (mapped) steps.push({ name: mapped.name, fn: mapped.fn });
  } else {
    const lower = message.toLowerCase();
    const seen = new Set();

    for (const intent of INTENTS) {
      if (intent.keys.some(k => lower.includes(k))) {
        if (!seen.has(intent.name)) {
          steps.push({ name: intent.name, fn: intent.fn });
          seen.add(intent.name);
        }
      }
    }
  }

  return steps;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { message = '', toolHint, context } = body;

  const steps = parseIntent(message, toolHint);

  if (!steps.length) {
    return res.json({
      reply: `I heard: "${message}". I can sync catalog, clean gibberish, generate products, audit the site, and test endpoints. Try: "Sync catalog, generate new products, then audit."`
    });
  }

  const messages = [];
  for (const step of steps) {
    try {
      messages.push(`▶ ${step.name}…`);
      const result = await step.fn();
      if (result?.ok) {
        messages.push(`✅ ${step.name}: ${result.summary || 'Done.'}`);
      } else {
        messages.push(`⚠️ ${step.name} returned issue: ${result?.summary || 'Unknown.'}`);
      }
    } catch (err) {
      console.error(`Tool [${step.name}] error:`, err);
      messages.push(`❌ ${step.name} failed: ${err.message}`);
    }
  }

  return res.json({
    messages,
    actionsRun: steps.map(s => s.name),
    count: steps.length
  });
}
