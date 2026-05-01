// api/auto-tuner.js - Applies safe optimizations automatically
import fs from 'fs/promises';
import path from 'path';
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';

const CONFIG_PATH = path.join(process.cwd(), 'adaptive-config.json');
const SCHEDULE_PATH = path.join(process.cwd(), 'adaptive-schedule.json');

async function loadConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load adaptive config:', err);
    return null;
  }
}

async function saveConfig(config) {
  try {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to save adaptive config:', err);
    return false;
  }
}

async function loadSchedule() {
  try {
    const raw = await fs.readFile(SCHEDULE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load adaptive schedule:', err);
    return null;
  }
}

async function saveSchedule(schedule) {
  try {
    await fs.writeFile(SCHEDULE_PATH, JSON.stringify(schedule, null, 2));
    return true;
  } catch (err) {
    console.error('Failed to save adaptive schedule:', err);
    return false;
  }
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
  const config = await loadConfig();
  if (!config) return { ok: false, error: 'Cannot load config' };

  const oldSize = config.safeRanges?.batchSize?.default || 5;
  if (newBatchSize < 1 || newBatchSize > 10) {
    return { ok: false, error: 'Batch size out of safe bounds' };
  }

  config.safeRanges.batchSize.default = newBatchSize;
  const saved = await saveConfig(config);
  if (!saved) return { ok: false, error: 'Failed to save config' };

  await logOptimization(
    'batch_size_adjust',
    `Routine performance indicates batch size ${oldSize} → ${newBatchSize}`,
    `Updated adaptive-config.json batchSize.default to ${newBatchSize}`,
    'auto'
  );

  return { ok: true, oldSize, newSize: newBatchSize };
}

export async function applyScheduleAdjustment(routine, newCron, reason) {
  const schedule = await loadSchedule();
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
  // Keep last 50 entries
  if (schedule.history.length > 50) schedule.history = schedule.history.slice(-50);

  const saved = await saveSchedule(schedule);
  if (!saved) return { ok: false, error: 'Failed to save schedule' };

  await logOptimization(
    'schedule_adjust',
    reason,
    `${routine} cron: ${oldCron} → ${newCron}`,
    'auto'
  );

  return { ok: true, routine, oldCron, newCron };
}

export async function applyCacheModeToggle(enabled) {
  // Cache mode flag stored in DB or config; for now, use a simple file flag
  const cacheFlagPath = path.join(process.cwd(), '.cache-mode-enabled');
  try {
    if (enabled) {
      await fs.writeFile(cacheFlagPath, 'true');
    } else {
      await fs.unlink(cacheFlagPath).catch(() => {});
    }

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
  const config = await loadConfig();
  const schedule = await loadSchedule();
  const cacheFlagPath = path.join(process.cwd(), '.cache-mode-enabled');

  let cacheEnabled = false;
  try {
    await fs.access(cacheFlagPath);
    cacheEnabled = true;
  } catch { }

  return {
    config,
    schedule,
    cacheMode: cacheEnabled ? 'enabled' : 'disabled'
  };
}
