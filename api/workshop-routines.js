// api/workshop-routines.js
// Autonomous routines with full performance intelligence
import {
  runCatalogSync,
  cleanupGibberish,
  generateNewProducts,
  runSiteAudit,
  testEndpoints,
  featureRecentProducts,
  applyMargin,
  getDBCounts
} from './workshop-product-tools.js';
import printify from './printify.js';
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';

async function timedStep(stepName, fn, opts = {}) {
  const start = Date.now();
  let result, error;
  try {
    result = await fn();
    const duration = Date.now() - start;
    return { step: stepName, result, duration, success: result?.ok !== false, error: null };
  } catch (err) {
    const duration = Date.now() - start;
    return { step: stepName, result: null, duration, success: false, error: err.message };
  }
}

export async function runHourlyRoutine() {
  const routineStart = Date.now();
  const steps = [];

  // Step 1: audit
  steps.push(await timedStep('audit', runSiteAudit));

  // Step 2: catalog check + auto-sync if empty
  steps.push(await timedStep('catalog_check', async () => {
    const catalog = await printify('catalog');
    const count = catalog?.catalog?.length || 0;
    if (count === 0) {
      const sync = await runCatalogSync();
      return { ok: true, summary: `Catalog empty, synced: ${sync.summary}` };
    }
    return { ok: true, summary: `Catalog healthy (${count} items)` };
  }));

  // Step 3: DB check
  steps.push(await timedStep('db_check', async () => {
    await ensureProductsSchema(pool);
    const counts = await getDBCounts();
    return { ok: true, summary: `DB: ${JSON.stringify(counts)}` };
  }));

  return persistRoutineLog('hourly', steps, routineStart);
}

export async function runNightlyRoutine(options = { rotateFeatured: true, applyMargin: false, generateProducts: false }) {
  const routineStart = Date.now();
  const steps = [];

  steps.push(await timedStep('audit', runSiteAudit));
  steps.push(await timedStep('catalog_sync', runCatalogSync));
  steps.push(await timedStep('gibberish_cleanup', cleanupGibberish));
  steps.push(await timedStep('endpoint_tests', testEndpoints));

  if (options.rotateFeatured) {
    steps.push(await timedStep('feature_rotation', () => featureRecentProducts(3)));
  }
  if (options.applyMargin) {
    steps.push(await timedStep('margin_apply', () => applyMargin(20)));
  }
  if (options.generateProducts) {
    steps.push(await timedStep('product_generation', generateNewProducts));
  }

  return persistRoutineLog('nightly', steps, routineStart);
}

export async function runOnDemandRoutine() {
  // Full routine, but no product generation by default (safer)
  return runNightlyRoutine({
    rotateFeatured: true,
    applyMargin: false,
    generateProducts: false
  });
}

async function persistRoutineLog(type, steps, routineStart) {
  const totalDuration = Date.now() - routineStart;
  const autoFixes = steps.filter(s => !s.success).length;
  const slowest = steps.reduce((a, b) => a.duration > b.duration ? a : b, steps[0]);

  const stepDurationsObj = {};
  steps.forEach(s => { stepDurationsObj[s.step] = s.duration; });

  const reportText = steps.map(s =>
    `[${s.success ? '✅' : '❌'}] ${s.step}: ${s.result?.summary || s.error} (${s.duration}ms)`
  ).join('\n');

  try {
    await pool.query(
      `INSERT INTO routine_logs 
       (routine_type, report, duration_ms, step_durations, slowest_step, auto_fixes, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        type,
        reportText,
        totalDuration,
        JSON.stringify(stepDurationsObj),
        slowest.step,
        autoFixes
      ]
    );
  } catch (err) {
    console.error('Failed to persist routine log:', err);
  }

  return {
    ok: true,
    summary: `${type} routine: ${totalDuration}ms total, ${steps.length} steps, slowest: ${slowest.step} (${slowest.duration}ms)`,
    performance: {
      totalDuration,
      stepCount: steps.length,
      slowest: { step: slowest.step, duration: slowest.duration },
      autoFixes
    }
  };
}
