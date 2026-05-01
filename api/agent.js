// api/agent.js - Lil Mystic's brain with intent parser + sequence runner + auth + logging
import { runCatalogSync, cleanupGibberish, generateNewProducts, runSiteAudit, testEndpoints, featureRecentProducts, setFeatured, applyMargin, runOnDemandRoutine } from './workshop-routines.js';
import { analyzeAndOptimize, applyAutoTuning } from './adaptive-engine.js';
import { generatePredictions, getOptimizationSuggestions } from './predictive-alerts.js';
import { getRoutineCostStats, getSystemHealthScore } from './resource-tracker.js';
import pool from '../src/utils/db.js';

const INTENTS = [
  { keys: ['sync', 'catalog'], name: 'Sync Printify catalog', fn: runCatalogSync },
  { keys: ['clean', 'gibberish', 'cleanup', 'junk'], name: 'Clean gibberish products', fn: cleanupGibberish },
  { keys: ['generate', 'create', 'build', 'new product', 'cosmic'], name: 'Generate new cosmic products', fn: generateNewProducts },
  { keys: ['audit', 'check', 'health', 'status'], name: 'Run full site audit', fn: runSiteAudit },
  { keys: ['test', 'endpoint', 'ping', 'api'], name: 'Test API endpoints', fn: testEndpoints },
  { keys: ['feature', 'highlight', 'showcase'], name: 'Feature recent products', fn: () => featureRecentProducts(3) },
  { keys: ['margin', 'price', 'reprice'], name: 'Apply margin markup', fn: () => applyMargin(20) },
  { keys: ['routine', 'sweep', 'full system', 'nightly'], name: 'Run full system routine', fn: runOnDemandRoutine },
  { keys: ['optimize', 'tuning', 'self-tune'], name: 'Analyze system optimization', fn: analyzeAndOptimize },
  { keys: ['predict', 'forecast', 'future'], name: 'Predict issues', fn: generatePredictions },
  { keys: ['cost', 'expense', 'spend'], name: 'Show cost analytics', fn: () => getRoutineCostStats(30) },
  { keys: ['performance', 'metrics', 'stats'], name: 'System performance score', fn: getSystemHealthScore },
];

async function getCurrentUser(req) {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/nlbl_auth=([^;]+)/);
  if (match && match[1] === 'authenticated') return 'admin';
  
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return 'api-user';
  
  return null;
}

async function logAction(user, action, outcome, req) {
  try {
    await pool.query(
      `INSERT INTO action_logs (user_email, action, outcome, ip, user_agent, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        user,
        action,
        outcome,
        req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
        req.headers['user-agent'] || ''
      ]
    );
  } catch (err) {
    console.error('Failed to log action:', err.message);
  }
}

function parseIntent(message, toolHint) {
  const steps = [];
  if (toolHint) {
    const mapped = INTENTS.find(i => i.keys.includes(toolHint));
    if (mapped) steps.push({ name: mapped.name, fn: mapped.fn, key: mapped.keys[0] });
  } else {
    const lower = message.toLowerCase();
    const seen = new Set();
    for (const intent of INTENTS) {
      if (intent.keys.some(k => lower.includes(k))) {
        if (!seen.has(intent.name)) {
          steps.push({ name: intent.name, fn: intent.fn, key: intent.keys[0] });
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { message = '', toolHint, context } = body;
  const steps = parseIntent(message, toolHint);

  if (!steps.length) {
    await logAction(user, `chat:${message.slice(0,50)}`, 'no_match', req);
    return res.json({
      reply: `I heard: "${message}". I can sync catalog, clean gibberish, generate products, audit the site, and test endpoints. Try: "Sync catalog, generate new products, then audit."`
    });
  }

  const messages = [];
  const actionsRun = [];

  for (const step of steps) {
    try {
      messages.push(`▶ ${step.name}…`);
      const result = await step.fn();
      actionsRun.push(step.key);
      if (result?.ok) {
        messages.push(`✅ ${step.name}: ${result.summary || 'Done.'}`);
        await logAction(user, step.key, 'success', req);
      } else {
        messages.push(`⚠️ ${step.name} returned issue: ${result?.summary || 'Unknown.'}`);
        await logAction(user, step.key, 'failed', req);
      }
    } catch (err) {
      console.error(`Tool [${step.name}] error:`, err);
      messages.push(`❌ ${step.name} failed: ${err.message}`);
      await logAction(user, step.key, `error:${err.message}`, req);
    }
  }

  return res.json({ messages, actionsRun, count: steps.length });
}
