// api/auto-tuner.js - Unified: adaptive engine + AI optimizer + predictive alerts + API endpoint
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import { sendDiscordAlert } from '../utils/discord-alerts.js';

// ========== Adaptive Config & Schedule (original auto-tuner) ==========
async function getAdaptiveConfig() {
  await ensureProductsSchema(pool);
  const res = await pool.query(`SELECT config FROM adaptive_config WHERE id = 1`);
  if (res.rows.length === 0) return null;
  const raw = res.rows[0].config;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}
async function updateAdaptiveConfig(configObj) {
  await ensureProductsSchema(pool);
  await pool.query(`UPDATE adaptive_config SET config = $1, updated_at = NOW() WHERE id = 1`, [JSON.stringify(configObj)]);
}
async function getAdaptiveSchedule() {
  await ensureProductsSchema(pool);
  const res = await pool.query(`SELECT schedule FROM adaptive_schedule WHERE id = 1`);
  if (res.rows.length === 0) return null;
  const raw = res.rows[0].schedule;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}
async function updateAdaptiveSchedule(scheduleObj) {
  await ensureProductsSchema(pool);
  await pool.query(`UPDATE adaptive_schedule SET schedule = $1, updated_at = NOW() WHERE id = 1`, [JSON.stringify(scheduleObj)]);
}
async function isCacheEnabledDB() {
  await ensureProductsSchema(pool);
  const res = await pool.query(`SELECT cache_mode_enabled FROM adaptive_config WHERE id = 1`);
  return res.rows[0]?.cache_mode_enabled || false;
}
async function setCacheEnabledDB(enabled) {
  await ensureProductsSchema(pool);
  await pool.query(`UPDATE adaptive_config SET cache_mode_enabled = $1, updated_at = NOW() WHERE id = 1`, [enabled]);
}
async function getCatalogCache() {
  await ensureProductsSchema(pool);
  const res = await pool.query(`SELECT catalog FROM cached_catalog WHERE id = 1`);
  if (res.rows.length === 0) return null;
  const raw = res.rows[0].catalog;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}
async function setCatalogCache(catalog) {
  await ensureProductsSchema(pool);
  await pool.query(`INSERT INTO cached_catalog (id, catalog, cached_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO UPDATE SET catalog = EXCLUDED.catalog, cached_at = EXCLUDED.cached_at`, [JSON.stringify(catalog)]);
}
async function logOptimization(decisionType, reason, action, severity = 'auto') {
  try {
    await ensureProductsSchema(pool);
    await pool.query(`INSERT INTO optimization_logs (decision_type, reason, action, severity, created_at) VALUES ($1, $2, $3, $4, NOW())`, [decisionType, reason, action, severity]);
  } catch (err) { console.error('Failed to log optimization:', err); }
}

export async function applyBatchSizeAdjustment(newBatchSize) {
  const config = await getAdaptiveConfig();
  if (!config) return { ok: false, error: 'Cannot load config' };
  const oldSize = config.safeRanges?.batchSize?.default || 5;
  if (newBatchSize < 1 || newBatchSize > 10) return { ok: false, error: 'Batch size out of safe bounds' };
  config.safeRanges.batchSize.default = newBatchSize;
  await updateAdaptiveConfig(config);
  await logOptimization('batch_size_adjust', `Routine performance indicates batch size ${oldSize} → ${newBatchSize}`, `Updated adaptive_config batchSize.default to ${newBatchSize}`, 'auto');
  return { ok: true, oldSize, newSize: newBatchSize };
}
export async function applyScheduleAdjustment(routine, newCron, reason) {
  const schedule = await getAdaptiveSchedule();
  if (!schedule) return { ok: false, error: 'Cannot load schedule' };
  const oldCron = schedule.schedule[routine]?.cron;
  schedule.schedule[routine].cron = newCron;
  schedule.schedule[routine].lastAdjusted = new Date().toISOString();
  schedule.schedule[routine].adjustmentReason = reason;
  schedule.history.push({ routine, oldCron, newCron, reason, timestamp: new Date().toISOString() });
  if (schedule.history.length > 50) schedule.history = schedule.history.slice(-50);
  await updateAdaptiveSchedule(schedule);
  await logOptimization('schedule_adjust', reason, `${routine} cron: ${oldCron} → ${newCron}`, 'auto');
  return { ok: true, routine, oldCron, newCron };
}
export async function applyCacheModeToggle(enabled) {
  try {
    await setCacheEnabledDB(enabled);
    await logOptimization('cache_mode_toggle', enabled ? 'High latency detected → enabling cached mode' : 'Latency normal → disabling cached mode', enabled ? 'Cache ON' : 'Cache OFF', 'auto');
    return { ok: true, cacheMode: enabled ? 'enabled' : 'disabled' };
  } catch (err) { return { ok: false, error: err.message }; }
}
export async function getCurrentOptimizationState() {
  const config = await getAdaptiveConfig();
  const schedule = await getAdaptiveSchedule();
  const cacheEnabled = await isCacheEnabledDB();
  return { config, schedule, cacheMode: cacheEnabled ? 'enabled' : 'disabled' };
}
export { getCatalogCache, setCatalogCache };

// ========== AI Optimizer (merged from ai-optimizer.js) ==========
const COSMIC_ADJECTIVES = ["Celestial", "Cosmic", "Ethereal", "Stellar", "Nebula", "Galactic", "Astral", "Interstellar", "Transcendent", "Eternal", "Infinite", "Quantum"];
const COSMIC_NOUNS = ["Legacy", "Memorial", "Horizon", "Voyage", "Odyssey", "Tribute", "Remembrance", "Ascension", "Evolution", "Infinity", "Beyond", "Eternity"];

function enhanceDescription(baseDesc, productName) {
  const adjectives = COSMIC_ADJECTIVES.sort(() => 0.5 - Math.random()).slice(0, 2);
  const nouns = COSMIC_NOUNS.sort(() => 0.5 - Math.random()).slice(0, 1);
  const cosmicFlair = `${adjectives.join(' ')} ${nouns[0]}`;
  return `${baseDesc || productName}. ${cosmicFlair} craftsmanship. No Limits Beyond Limitations.`;
}
function suggestPrice(currentPrice, category = 'other') {
  const markup = currentPrice < 10 ? 0.25 : 0.20;
  const suggested = Math.round(currentPrice * (1 + markup) * 100) / 100;
  return { current: currentPrice, suggested, markupPercent: markup * 100, reason: 'Standard 20% margin applied' };
}
function suggestCategory(title, tags = []) {
  const lower = title.toLowerCase();
  if (lower.includes('hoodie')) return 'hoodie';
  if (lower.includes('sweatshirt')) return 'sweatshirt';
  if (lower.includes('t-shirt') || lower.includes('tee')) return 'tee';
  if (lower.includes('hat') || lower.includes('cap')) return 'hat';
  if (lower.includes('poster')) return 'poster';
  if (tags.includes('Memorial')) return 'memorial';
  return 'cosmic';
}

export async function optimizeProduct(productId) {
  await ensureProductsSchema(pool);
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
  if (!result.rows.length) return { ok: false, error: 'Product not found' };
  const product = result.rows[0];
  const changes = {};
  const priceSuggestion = suggestPrice(Number(product.price));
  if (priceSuggestion.suggested > product.price) changes.price = priceSuggestion;
  const category = suggestCategory(product.name, product.category ? [product.category] : []);
  if (category !== product.category) changes.category = category;
  if ((product.description?.length || 0) < 50) {
    const newDesc = enhanceDescription(product.description, product.name);
    changes.description = newDesc;
  }
  if (Object.keys(changes).length) {
    await pool.query(`UPDATE products SET price = COALESCE($1, price), category = COALESCE($2, category), description = COALESCE($3, description) WHERE id = $4`, [changes.price?.suggested, changes.category, changes.description, productId]);
  }
  return { ok: true, productId, changesApplied: Object.keys(changes).length, changes };
}

export async function runBatchOptimization(limit = 20) {
  await ensureProductsSchema(pool);
  const result = await pool.query(`SELECT id, name, description, price, category FROM products WHERE active = true ORDER BY created_at DESC LIMIT $1`, [limit]);
  const products = result.rows;
  const optimized = [];
  for (const p of products) {
    const opt = await optimizeProduct(p.id);
    if (opt.ok && opt.changesApplied) optimized.push(opt);
  }
  return { ok: true, total: products.length, optimized: optimized.length, details: optimized };
}

export async function getAIOptimizationStatus() {
  await ensureProductsSchema(pool);
  const result = await pool.query(`
    SELECT COUNT(*)::int AS total_products,
           COUNT(CASE WHEN description IS NULL OR LENGTH(description) < 50 THEN 1 END)::int AS needs_description,
           COUNT(CASE WHEN price < 10 THEN 1 END)::int AS low_price_count,
           COUNT(CASE WHEN category IS NULL THEN 1 END)::int AS uncategorized
    FROM products WHERE active = true
  `);
  const stats = result.rows[0];
  return { ok: true, stats };
}

// ========== Adaptive Engine (merged from adaptive-engine.js) ==========
const CONFIG = {
  autoFixEscalatePerHour: 10, costSpikePercentage: 50, predictionConfidence: 0.8,
  routineDurationIncreasePercent: 30, latencyIncreasePercent: 50, batchSizeMin: 1, batchSizeMax: 10,
  scheduleShiftMaxHours: 2, cacheLatencyThresholdMs: 800, cacheRecoveryLatencyMs: 300,
  cacheConsecutiveChecks: 3, routineDurationThresholdMs: 30000, aiOptimizationPerRun: 5, maxAutoPriceAdjustmentPercent: 20
};

async function getRecentMetrics(hoursBack = 24) {
  await ensureProductsSchema(pool);
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  const result = await pool.query(`SELECT * FROM routine_logs WHERE created_at >= $1 ORDER BY created_at DESC`, [since]);
  return result.rows;
}
async function getRecentLatencies(hours = 1) {
  const metrics = await getRecentMetrics(hours);
  const latencies = [];
  metrics.forEach(m => {
    (m.report || '').split('\n').forEach(line => {
      const match = line.match(/(\w+):.*?(\d+)ms/);
      if (match) latencies.push(parseInt(match[2]));
    });
  });
  return latencies;
}

export async function analyzeAndOptimize() {
  await ensureProductsSchema(pool);
  const metrics = await getRecentMetrics(24);
  const applied = [];
  const escalations = [];

  // 1. Auto-fix storm detection
  const lastHour = metrics.filter(m => new Date(m.created_at) > new Date(Date.now() - 60 * 60 * 1000));
  const recentAutoFixes = lastHour.reduce((sum, m) => sum + (m.auto_fixes || 0), 0);
  if (recentAutoFixes > CONFIG.autoFixEscalatePerHour) {
    escalations.push({ type: 'auto_fix_storm', severity: 'high', message: `Auto-fixes: ${recentAutoFixes} in last hour (threshold: ${CONFIG.autoFixEscalatePerHour})` });
  }

  // 2. Batch size auto-tuning
  const hourlyDurations = metrics.filter(m => m.routine_type === 'hourly' && m.duration_ms).map(m => m.duration_ms);
  if (hourlyDurations.length >= 3) {
    const avgDuration = hourlyDurations.reduce((a, b) => a + b, 0) / hourlyDurations.length;
    const state = await getCurrentOptimizationState();
    const currentBatchSize = state?.config?.safeRanges?.batchSize?.default || 5;
    if (avgDuration > CONFIG.routineDurationThresholdMs && currentBatchSize > CONFIG.batchSizeMin) {
      const newSize = Math.max(CONFIG.batchSizeMin, currentBatchSize - 1);
      const result = await applyBatchSizeAdjustment(newSize);
      if (result.ok) applied.push(`Batch size ${currentBatchSize} → ${newSize} (avg ${Math.round(avgDuration)}ms)`);
    } else if (avgDuration < 10000 && currentBatchSize < CONFIG.batchSizeMax) {
      const newSize = Math.min(CONFIG.batchSizeMax, currentBatchSize + 1);
      const result = await applyBatchSizeAdjustment(newSize);
      if (result.ok) applied.push(`Batch size ${currentBatchSize} → ${newSize} (avg ${(avgDuration/1000).toFixed(1)}s)`);
    }
  }

  // 3. Cache mode auto-toggle
  const recentLatencies = await getRecentLatencies(1);
  if (recentLatencies.length >= CONFIG.cacheConsecutiveChecks) {
    const avgLatency = recentLatencies.slice(0, CONFIG.cacheConsecutiveChecks).reduce((a, b) => a + b, 0) / CONFIG.cacheConsecutiveChecks;
    const state = await getCurrentOptimizationState();
    const cacheEnabled = state?.cacheMode === 'enabled';
    if (avgLatency > CONFIG.cacheLatencyThresholdMs && !cacheEnabled) {
      const result = await applyCacheModeToggle(true);
      if (result.ok) applied.push('Cache mode ENABLED due to high latency');
    } else if (avgLatency < CONFIG.cacheRecoveryLatencyMs && cacheEnabled) {
      const result = await applyCacheModeToggle(false);
      if (result.ok) applied.push('Cache mode DISABLED — latency recovered');
    }
  }

  // 4. Schedule adjustment
  const hourlyCount = metrics.filter(m => m.routine_type === 'hourly').length;
  if (hourlyCount >= 6) {
    const avgHourlyDuration = metrics.filter(m => m.routine_type === 'hourly').slice(0, 6).reduce((a, b) => a + b.duration_ms, 0) / 6;
    if (avgHourlyDuration > CONFIG.routineDurationThresholdMs * 1.5) {
      const schedule = await getCurrentOptimizationState();
      if (schedule?.schedule?.hourly?.cron === '0 * * * *') {
        const result = await applyScheduleAdjustment('hourly', '0 */2 * * *', `Duration ${Math.round(avgHourlyDuration)}ms exceeds threshold`);
        if (result.ok) applied.push('Hourly schedule adjusted: every 2 hours');
      }
    }
  }

  // 5. AI product optimization (safe subset)
  try {
    const aiResult = await runBatchOptimization(CONFIG.aiOptimizationPerRun);
    if (aiResult.ok && aiResult.optimized > 0) {
      applied.push(`AI optimized ${aiResult.optimized} products (descriptions, categories, pricing)`);
    }
  } catch (err) {
    console.error('AI optimization failed:', err.message);
  }

  // Log
  if (applied.length || escalations.length) {
    try {
      await pool.query(`INSERT INTO optimization_logs (decision_type, reason, action, severity, created_at) VALUES ($1, $2, $3, $4, NOW())`, ['auto_tuning', `Auto-tuning cycle: ${applied.length} actions, ${escalations.length} escalations`, applied.join('; '), escalations.length ? 'escalated' : 'auto']);
    } catch (err) { console.error('Failed to log optimization:', err.message); }
  }

  return { ok: true, summary: `Auto-tuning: ${applied.length} optimizations applied${escalations.length ? `, ${escalations.length} escalations` : ''}`, applied, escalations };
}

export async function getAutoTuningStatus() {
  const state = await getCurrentOptimizationState();
  return { ok: true, state, lastRun: new Date().toISOString() };
}

// ========== Predictive Alerts (merged from predictive-alerts.js) ==========
export async function getLatencyHistory(hours = 24) {
  await ensureProductsSchema(pool);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const result = await pool.query(`SELECT report, created_at FROM routine_logs WHERE created_at >= $1 AND report LIKE '%latency:%' ORDER BY created_at DESC`, [since]);
  const history = [];
  result.rows.forEach(row => {
    (row.report || '').split('\n').forEach(line => {
      const match = line.match(/(\w+):.*?(\d+)ms/);
      if (match) history.push({ endpoint: match[1], latency: parseInt(match[2]), created_at: row.created_at });
    });
  });
  return history;
}

function predictNextValue(history, key = 'latency', window = 6) {
  if (history.length < window * 2) return { predicted: null, confidence: 0, message: 'insufficient data' };
  const values = history.map(h => h[key]);
  const recent = values.slice(0, window);
  const prev = values.slice(window, window * 2);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prevAvg = prev.reduce((a, b) => a + b, 0) / prev.length;
  const trendSlope = (recentAvg - prevAvg) / prevAvg;
  const predicted = recentAvg * (1 + trendSlope);
  const confidence = Math.min(Math.abs(trendSlope) * 2, 1);
  return { predicted, confidence, trend: trendSlope > 0 ? 'up' : 'down' };
}

export async function generatePredictions() {
  const latencyHistory = await getLatencyHistory(24);
  const predictions = [];
  const byEndpoint = {};
  latencyHistory.forEach(h => { (byEndpoint[h.endpoint] = byEndpoint[h.endpoint] || []).push(h); });
  for (const [endpoint, history] of Object.entries(byEndpoint)) {
    const pred = predictNextValue(history);
    if (pred.confidence > 0.5 && pred.predicted) {
      if (pred.predicted > 800) {
        predictions.push({ endpoint, predictedLatency: Math.round(pred.predicted), confidence: pred.confidence, severity: 'high', message: `${endpoint} latency predicted to exceed 800ms within 6 hours (current trend: ${(pred.trend === 'up' ? '+' : '')}${(pred.predicted - history[0].latency).toFixed(0)}ms)` });
      } else if (pred.predicted > 500) {
        predictions.push({ endpoint, predictedLatency: Math.round(pred.predicted), confidence: pred.confidence, severity: 'medium', message: `${endpoint} latency trending upward. Predicted: ${Math.round(pred.predicted)}ms` });
      }
    }
  }

  // Catalog sync failure prediction
  const catalogHistory = await pool.query(`SELECT report, created_at FROM routine_logs WHERE report LIKE '%catalog%' ORDER BY created_at DESC LIMIT 12`);
  const catalogCounts = [];
  catalogHistory.rows.forEach(row => {
    const match = row.report.match(/catalog healthy \((\d+) items\)/);
    if (match) catalogCounts.push({ count: parseInt(match[1]), created_at: row.created_at });
  });
  if (catalogCounts.length >= 6) {
    const recent = catalogCounts.slice(0, 3).map(c => c.count);
    const older = catalogCounts.slice(3, 6).map(c => c.count);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg < olderAvg * 0.7) {
      predictions.push({ type: 'catalog_decline', severity: 'high', message: `Catalog count dropped ${Math.round((1 - recentAvg/olderAvg)*100)}% — sync failure likely tonight` });
    }
  }

  return { ok: true, predictions };
}

export async function getOptimizationSuggestions() {
  const metrics = await getRecentMetrics(24);
  const suggestions = [];
  const hourlyDurations = metrics.filter(m => m.routine_type === 'hourly' && m.duration_ms).map(m => m.duration_ms);
  if (hourlyDurations.length >= 5) {
    const avg = hourlyDurations.reduce((a, b) => a + b, 0) / hourlyDurations.length;
    if (avg > 30000) {
      suggestions.push({ category: 'performance', priority: 'high', message: `Average routine duration ${Math.round(avg/1000)}s exceeds healthy threshold. Consider reducing batch sizes or increasing schedule interval.`, action: 'reduce_batch_size_or_increase_interval' });
    }
  }
  const autoFixRate = metrics.reduce((sum, m) => sum + (m.auto_fixes || 0), 0) / (metrics.length || 1);
  if (autoFixRate > 0.5) {
    suggestions.push({ category: 'stability', priority: 'high', message: `Auto-fixes occurring in ${(autoFixRate*100).toFixed(0)}% of routine runs. System instability detected — run deep audit and review error logs.`, action: 'run_deep_audit' });
  }
  return { ok: true, suggestions };
}

// ========== API Handler ==========
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.body || {};
  const { queryAction } = req.query || {};

  try {
    // Analyze + optimize (full auto-tuning cycle)
    if (action === 'analyze' || queryAction === 'analyze') {
      const result = await analyzeAndOptimize();
      return res.status(200).json(result);
    }

    // Status
    if (action === 'status' || queryAction === 'status') {
      const status = await getAutoTuningStatus();
      const aiStatus = await getAIOptimizationStatus();
      return res.status(200).json({ ...status, aiStatus });
    }

    // AI batch optimization
    if (action === 'optimize' || queryAction === 'optimize') {
      const limit = (req.body?.limit) || (req.query?.limit) || 20;
      const result = await runBatchOptimization(parseInt(limit));
      return res.status(200).json(result);
    }

    // Predictive alerts
    if (action === 'predict' || queryAction === 'predict') {
      const result = await generatePredictions();
      return res.status(200).json(result);
    }

    // Optimization suggestions
    if (action === 'suggestions' || queryAction === 'suggestions') {
      const result = await getOptimizationSuggestions();
      return res.status(200).json(result);
    }

    // Get latency history
    if (action === 'latency-history' || queryAction === 'latency-history') {
      const hours = (req.body?.hours) || (req.query?.hours) || 24;
      const result = await getLatencyHistory(parseInt(hours));
      return res.status(200).json({ history: result });
    }

    // Apply specific adjustment (admin)
    if (action === 'apply-batch') {
      const { batchSize } = req.body;
      const result = await applyBatchSizeAdjustment(batchSize);
      return res.status(200).json(result);
    }
    if (action === 'apply-schedule') {
      const { routine, cron, reason } = req.body;
      const result = await applyScheduleAdjustment(routine, cron, reason);
      return res.status(200).json(result);
    }
    if (action === 'toggle-cache') {
      const { enabled } = req.body;
      const result = await applyCacheModeToggle(enabled);
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Unknown action. Available: analyze, status, optimize, predict, suggestions, latency-history, apply-batch, apply-schedule, toggle-cache' });

  } catch (err) {
    console.error('Auto-Tuner API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}