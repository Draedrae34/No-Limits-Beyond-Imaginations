// api/agent.js - Unified Lil Mystic Agent Core (intents + heartbeat + Discord alerts)
// POST actions: intent (chat), heartbeat
// GET actions: status, cost, health, resources
// Merged: agent + agent-heartbeat + resource-tracker endpoints
import {
  runCatalogSync, cleanupGibberish, generateNewProducts, runSiteAudit,
  testEndpoints, featureRecentProducts, setFeatured, applyMargin
} from '../src/workshop-product-tools.js';
import { runOnDemandRoutine } from '../src/workshop-routines.js';
import { analyzeAndOptimize, getAutoTuningStatus, generatePredictions } from './auto-tuner.js';
import { getRoutineCostStats, getSystemHealthScore, getCurrentResourceUsage } from '../utils/resource-tracker.js';
import { sendDiscordAlert } from '../utils/discord-alerts.js';
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import { verifyAdmin } from '../src/utils/auth.js';
import { getLilMysticSystemPrompt, buildLilMysticCreativeReply } from '../src/lil-mystic-persona.js';

const INTENTS = [
  { keys: ['sync', 'catalog'], name: 'Sync Printify catalog', fn: runCatalogSync },
  { keys: ['clean', 'gibberish', 'cleanup', 'junk'], name: 'Clean gibberish products', fn: cleanupGibberish },
  { keys: ['generate', 'create', 'build', 'new product', 'cosmic'], name: 'Generate new cosmic products', fn: generateNewProducts },
  { keys: ['audit', 'check', 'health', 'status'], name: 'Run full site audit', fn: runSiteAudit },
  { keys: ['test', 'endpoint', 'ping', 'api'], name: 'Test API endpoints', fn: testEndpoints },
  { keys: ['feature', 'highlight', 'showcase'], name: 'Feature recent products', fn: () => featureRecentProducts(3) },
  { keys: ['margin', 'price', 'reprice'], name: 'Apply margin markup', fn: () => applyMargin(20) },
  { keys: ['routine', 'sweep', 'full system', 'nightly'], name: 'Run full system routine', fn: runOnDemandRoutine },
  { keys: ['optimize', 'tuning', 'self-tune', 'auto-tune'], name: 'Analyze system optimization', fn: analyzeAndOptimize },
  { keys: ['predict', 'forecast', 'future'], name: 'Predict issues', fn: generatePredictions },
  { keys: ['cost', 'expense', 'spend'], name: 'Show cost analytics', fn: () => getRoutineCostStats(30) },
  { keys: ['performance', 'metrics', 'stats'], name: 'System performance score', fn: getSystemHealthScore },
  { keys: ['memorize', 'photographic', 'remember'], name: 'Neural Memory Ingestion', fn: analyzeAndOptimize },
  { keys: ['copycat', 'mimic', 'upgrade'], name: 'Neural Mimicry Protocol', fn: analyzeAndOptimize },
];

async function getCurrentUser(req) {
  const authHeader = req.headers.authorization || '';
  if (await verifyAdmin(req)) {
    if (authHeader.startsWith('Bearer ')) return 'api-user';
    return 'admin';
  }
  return null;
}

async function logAction(user, action, outcome, req) {
  try {
    await pool.query(
      `INSERT INTO action_logs (user_email, action, outcome, ip, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [user, action, outcome, req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown', req.headers['user-agent'] || '']
    );
  } catch (err) {
    console.error('Failed to log action:', err.message);
  }
}

function getQueryParams(req) {
  if (req.query && Object.keys(req.query).length > 0) {
    return req.query;
  }
  try {
    return Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries());
  } catch (err) {
    return {};
  }
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';


async function callOpenAIChat(message) {
  if (!OPENAI_API_KEY) return null;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: getLilMysticSystemPrompt() },
          { role: 'user', content: message }
        ],
        max_tokens: 320,
        temperature: 0.85,
        top_p: 0.9,
        frequency_penalty: 0.2,
        presence_penalty: 0.25,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenAI chat request failed:', response.status, text);
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('OpenAI chat error:', err);
    return null;
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

function fallbackChatReply(message) {
  return buildLilMysticCreativeReply(message);
}

async function runAgentChat(message) {
  if (!message || !message.trim()) {
    return 'Ask me anything about creative workflow, music, products, or the private workshop.';
  }

  const aiResponse = await callOpenAIChat(message);
  return aiResponse || fallbackChatReply(message);
}

// --- Intent Handler ---
async function handleIntent(req, res, body, user) {
  const { action, message = '', toolHint, context } = body;
  const steps = parseIntent(message, toolHint);

  if (action === 'chat' || !steps.length) {
    const reply = await runAgentChat(message);
    await logAction(user, `chat:${message.slice(0,50)}`, 'chat', req);
    return res.json({ reply });
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
        await logAction('admin', step.key, 'success', req);
      } else {
        messages.push(`⚠️ ${step.name} returned issue: ${result?.summary || 'Unknown.'}`);
        await logAction('admin', step.key, 'failed', req);
      }
    } catch (err) {
      console.error(`Tool [${step.name}] error:`, err);
      messages.push(`❌ ${step.name} failed: ${err.message}`);
      await logAction('admin', step.key, `error:${err.message}`, req);
      
      // Discord alert on tool failure
      await sendDiscordAlert('error', `Agent Tool Failed: ${step.name}`, [
        { name: 'Tool', value: step.name, inline: true },
        { name: 'Error', value: err.message.slice(0,200), inline: false }
      ]);
    }
  }

  return res.json({ messages, actionsRun, count: steps.length });
}

// --- Heartbeat Handler ---
async function handleHeartbeat(req, res) {
  const ENDPOINTS = [
    '/api/printify?action=status',
    '/api/shop',
    '/api/orders',
    '/api/messages',
    '/api/logs?action=routine'
  ];

  async function measureLatency(url) {
    const start = Date.now();
    try {
      const r = await fetch(url, { method: 'GET' });
      return { url, ok: r.ok, latency: Date.now() - start, status: r.status };
    } catch (e) {
      return { url, ok: false, latency: Date.now() - start, error: e.message };
    }
  }

  const results = await Promise.all(ENDPOINTS.map(measureLatency));
  const slow = results.filter(r => r.latency > 500);
  const errors = results.filter(r => !r.ok);

  // DB checks
  await ensureProductsSchema(pool);
  const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await pool.query(
    `SELECT routine_type, duration_ms, auto_fixes FROM routine_logs WHERE created_at >= $1 ORDER BY created_at DESC`,
    [lastHour]
  );
  const hourlyCount = recent.rows.filter(r => r.routine_type === 'hourly').length;

  const alerts = [];
  errors.forEach(e => alerts.push({ type: 'error', message: `Endpoint down: ${e.url}` }));
  slow.forEach(s => alerts.push({ type: 'warning', message: `Slow: ${s.url} (${s.latency}ms)` }));
  if (hourlyCount === 0) alerts.push({ type: 'warning', message: 'No hourly runs in last hour' });

  const errorCount = alerts.filter(a => a.type === 'error').length;
  const health = errorCount ? 'critical' : alerts.length ? 'degraded' : 'healthy';

  // Discord alert if critical
  if (health === 'critical' && errors.length > 0) {
    await sendDiscordAlert('error', 'NLBL System Critical — Endpoints Down', 
      errors.map(e => ({ name: e.url, value: `Status ${e.status || 'ERR'}`, inline: true })),
      `Multiple endpoints are failing. Immediate investigation required.`
    );
  }

  console.log(`🌌 [Lil Mystic Heartbeat] Health: ${health}, Alerts: ${alerts.length}`);
  return res.json({ health, alerts, timestamp: new Date().toISOString() });
}

// --- Main Handler ---
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = getQueryParams(req);
  if (req.method === 'GET' && query.action === 'heartbeat') {
    return res.status(200).json({
      success: true,
      status: 'ok',
      service: 'Lil Mystic Agent',
      timestamp: new Date().toISOString()
    });
  }

  // Auth check
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    if (req.method === 'POST') {
      let body = req.body || {};
      if (typeof body === 'string') body = JSON.parse(body);
      const { action } = body;

      if (action === 'heartbeat') {
        console.log(`🌌 [Lil Mystic] Heartbeat triggered by ${user}`);
        return await handleHeartbeat(req, res);
      }

      // Default: handle intent (chat)
      return await handleIntent(req, res, body, user);
    }

    if (req.method === 'GET') {
      const { action } = query;
      if (action === 'status') {
        const status = await getAutoTuningStatus();
        return res.json(status);
      }
      if (action === 'cost') {
        const days = parseInt(query.days) || 30;
        const stats = await getRoutineCostStats(days);
        return res.json(stats);
      }
      if (action === 'health') {
        const health = await getSystemHealthScore();
        return res.json(health);
      }
      if (action === 'resources') {
        const usage = getCurrentResourceUsage();
        return res.json(usage);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('🌌 [Lil Mystic] Handler error:', err);
    
    // Discord alert for unhandled exceptions
    await sendDiscordAlert('error', 'Lil Mystic Unhandled Exception', [
      { name: 'Endpoint', value: req.url || 'unknown', inline: true },
      { name: 'Method', value: req.method, inline: true },
      { name: 'Error', value: err.message.slice(0,300), inline: false }
    ], `An unhandled exception occurred in the agent. Check logs for full stack trace.`);
    
    return res.status(500).json({ error: err.message });
  }
}
