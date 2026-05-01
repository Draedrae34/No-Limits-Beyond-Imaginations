// api/workshop-routines.js
// Autonomous routines with performance intelligence
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

async function timed(stepName, fn, autoFix = false) {
  const start = Date.now();
  let result;
  try {
    result = await fn();
    const duration = Date.now() - start;
    return {
      step: stepName,
      duration,
      success: result?.ok !== false,
      autoFix: autoFix ? 1 : 0,
      summary: result?.summary || 'Done'
    };
  } catch (err) {
    const duration = Date.now() - start;
    return {
      step: stepName,
      duration,
      success: false,
      autoFix: 0,
      error: err.message
    };
  }
}

export async function runHourlyRoutine() {
  const routineStart = Date.now();
  const stepResults = [];
  const autoFixes = [];

  // Step 1: Audit
  stepResults.push(await timed('audit', runSiteAudit));

  // Step 2: Catalog check + auto-sync if empty
  const catalogResult = await timed('catalog_check', async () => {
    const catalog = await printify('catalog');
    const count = catalog?.catalog?.length || 0;
    if (count === 0) {
      const sync = await runCatalogSync();
      return { ok: true, summary: `Catalog was empty, synced: ${sync.summary}` };
    }
    return { ok: true, summary: `Catalog healthy (${count} items)` };
  });
  stepResults.push(catalogResult);

  // Step 3: DB check
  stepResults.push(await timed('db_check', async () => {
    await ensureProductsSchema(pool);
    const counts = await getDBCounts();
    return { ok: true, summary: `DB counts: ${JSON.stringify(counts)}` };
  }));

  const totalDuration = Date.now() - routineStart;
  const slowest = stepResults.reduce((a, b) => (a.duration > b.duration ? a : b), stepResults[0]);
  const autoFixCount = autoFixes.length;

  // Persist performance log
  try {
    await pool.query(
      `INSERT INTO routine_logs (routine_type, report, duration_ms, step_durations, slowest_step, auto_fixes, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        'hourly',
        stepResults.map(r => `[${r.success ? '✅' : '❌'}] ${r.step}: ${r.summary || r.error}`).join('\n'),
        totalDuration,
        JSON.stringify(stepResults.map(({ step, duration }) => ({ step, duration }))),
        slowest.step,
        autoFixCount
      ]
    );
  } catch (err) {
    console.error('Failed to save hourly perf log:', err);
  }

  return {
    ok: true,
    summary: `Hourly routine completed in ${(totalDuration / 1000).toFixed(1)}s. Slowest: ${slowest.step} (${slowest.duration}ms). Auto-fixes: ${autoFixCount}.`,
    performance: { totalDuration, stepResults, slowest: slowest.step, autoFixes: autoFixCount }
  };
}

export async function runNightlyRoutine(options = { rotateFeatured: true, applyMargin: false, generateProducts: false }) {
  const routineStart = Date.now();
  const stepResults = [];
  const autoFixes = [];

  stepResults.push(await timed('audit', runSiteAudit));

  stepResults.push(await timed('catalog_sync', runCatalogSync));

  stepResults.push(await timed('gibberish_cleanup', cleanupGibberish));

  stepResults.push(await timed('endpoint_tests', testEndpoints));

  if (options.rotateFeatured) {
    stepResults.push(await timed('feature_rotation', () => featureRecentProducts(3)));
  }

  if (options.applyMargin) {
    stepResults.push(await timed('margin_apply', () => applyMargin(20)));
  }

  if (options.generateProducts) {
    stepResults.push(await timed('product_generation', generateNewProducts));
  }

  const totalDuration = Date.now() - routineStart;
  const slowest = stepResults.reduce((a, b) => (a.duration > b.duration ? a : b), stepResults[0]);
  const autoFixCount = stepResults.filter(r => !r.success).length;

  const fullReport = stepResults.map(r => `[${r.success ? '✅' : '❌'}] ${r.step}: ${r.summary || r.error}`).join('\n');

  // Persist performance log
  try {
    await pool.query(
      `INSERT INTO routine_logs (routine_type, report, duration_ms, step_durations, slowest_step, auto_fixes, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        'nightly',
        fullReport,
        totalDuration,
        JSON.stringify(stepResults.map(({ step, duration }) => ({ step, duration }))),
        slowest.step,
        autoFixCount
      ]
    );
  } catch (err) {
    console.error('Failed to save nightly perf log:', err);
  }

  return {
    ok: true,
    summary: `Nightly routine completed in ${(totalDuration / 1000).toFixed(1)}s. Slowest: ${slowest.step} (${slowest.duration}ms). Issues: ${autoFixCount}.`,
    report: fullReport,
    performance: { totalDuration, stepResults, slowest: slowest.step, autoFixes: autoFixCount }
  };
}

export async function runOnDemandRoutine() {
  return runNightlyRoutine({
    rotateFeatured: true,
    applyMargin: false,
    generateProducts: false
  });
}
