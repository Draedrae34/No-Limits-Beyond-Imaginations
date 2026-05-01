// api/auto-tuner.js - Applies safe optimizations automatically (DB-only, Vercel-compatible)
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';

async function getAdaptiveConfig() {
  await ensureProductsSchema(pool);
  const res = await pool.query(`SELECT config FROM adaptive_config WHERE id = 1`);
  if (res.rows.length === 0) {
    return null;
  }
  const raw = res.rows[0].config;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

async function updateAdaptiveConfig(configObj) {
  await ensureProductsSchema(pool);
  await pool.query(
    `UPDATE adaptive_config SET config = $1, updated_at = NOW() WHERE id = 1`,
    [JSON.stringify(configObj)]
  );
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
  await pool.query(
    `UPDATE adaptive_schedule SET schedule = $1, updated_at = NOW() WHERE id = 1`,
    [JSON.stringify(scheduleObj)]
  );
}

async function isCacheEnabledDB() {
  await ensureProductsSchema(pool);
  const res = await pool.query(`SELECT cache_mode_enabled FROM adaptive_config WHERE id = 1`);
  return res.rows[0]?.cache_mode_enabled || false;
}

async function setCacheEnabledDB(enabled) {
  await ensureProductsSchema(pool);
  await pool.query(
    `UPDATE adaptive_config SET cache_mode_enabled = $1, updated_at = NOW() WHERE id = 1`,
    [enabled]
  );
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
  await pool.query(
    `INSERT INTO cached_catalog (id, catalog, cached_at) VALUES (1, $1, NOW())
     ON CONFLICT (id) DO UPDATE SET catalog = EXCLUDED.catalog, cached_at = EXCLUDED.cached_at`,
    [JSON.stringify(catalog)]
  );
}

async function logOptimization(decisionType, reason, action, severity = 'auto') {
  try {
    await ensureProductsSchema(pool);
    await pool.query(
      `INSERT INTO optimization_logs (decision_type, reason, action, severity, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [decisionType, reason, action, severity]
    );
  } catch (err) {
    console.error('Failed to log optimization:', err);
  }
}

export async function applyBatchSizeAdjustment(newBatchSize) {
  const config = await getAdaptiveConfig();
  if (!config) return { ok: false, error: 'Cannot load config' };

  const oldSize = config.safeRanges?.batchSize?.default || 5;
  if (newBatchSize < 1 || newBatchSize > 10) {
    return { ok: false, error: 'Batch size out of safe bounds' };
  }

  config.safeRanges.batchSize.default = newBatchSize;
  await updateAdaptiveConfig(config);

  await logOptimization(
    'batch_size_adjust',
    `Routine performance indicates batch size ${oldSize} → ${newBatchSize}`,
    `Updated adaptive_config batchSize.default to ${newBatchSize}`,
    'auto'
  );

  return { ok: true, oldSize, newSize: newBatchSize };
}

export async function applyScheduleAdjustment(routine, newCron, reason) {
  const schedule = await getAdaptiveSchedule();
  if (!schedule) return { ok: false, error: 'Cannot load schedule' };

  const oldCron = schedule.schedule[routine]?.cron;
  schedule.schedule[routine].cron = newCron;
  schedule.schedule[routine].lastAdjusted = new Date().toISOString();
  schedule.schedule[routine].adjustmentReason = reason;

  // Add to history
  schedule.history.push({
    routine,
    oldCron,
    newCron,
    reason,
    timestamp: new Date().toISOString()
  });
  if (schedule.history.length > 50) schedule.history = schedule.history.slice(-50);

  await updateAdaptiveSchedule(schedule);

  await logOptimization(
    'schedule_adjust',
    reason,
    `${routine} cron: ${oldCron} → ${newCron}`,
    'auto'
  );

  return { ok: true, routine, oldCron, newCron };
}

export async function applyCacheModeToggle(enabled) {
  try {
    await setCacheEnabledDB(enabled);
    await logOptimization(
      'cache_mode_toggle',
      enabled ? 'High latency detected → enabling cached mode' : 'Latency normal → disabling cached mode',
      enabled ? 'Cache ON' : 'Cache OFF',
      'auto'
    );
    return { ok: true, cacheMode: enabled ? 'enabled' : 'disabled' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function getCurrentOptimizationState() {
  const config = await getAdaptiveConfig();
  const schedule = await getAdaptiveSchedule();
  const cacheEnabled = await isCacheEnabledDB();

  return {
    config,
    schedule,
    cacheMode: cacheEnabled ? 'enabled' : 'disabled'
  };
}

// Export catalog cache functions for shop.js
export { getCatalogCache, setCatalogCache };
