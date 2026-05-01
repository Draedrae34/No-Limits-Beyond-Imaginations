// api/workshop-routines.js
// Autonomous routines: hourly + nightly
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

// Helper: post notification to Workshop chat (requires user session, so mostly for logging)
async function postAgentNote(message) {
  // In a real implementation, this could:
  // - Insert into a notifications table
  // - Trigger a push/WebSocket
  // - Email admin
  // For now, just log
  console.log(`[Lil Mystic Routine] ${message}`);
  return message;
}

export async function runHourlyRoutine() {
  const results = [];
  results.push(await postAgentNote('=== Hourly Routine Start ==='));

  // Light audit
  const audit = await runSiteAudit();
  results.push(audit.summary);

  // Catalog freshness check
  try {
    const catalog = await printify('catalog');
    const count = catalog?.catalog?.length || 0;
    if (count === 0) {
      results.push('⚠️ Catalog empty — initiating sync');
      const sync = await runCatalogSync();
      results.push(sync.summary);
    } else {
      results.push(`✅ Catalog healthy (${count} items)`);
    }
  } catch (err) {
    results.push(`❌ Catalog check failed: ${err.message}`);
  }

  // DB count check
  try {
    await ensureProductsSchema(pool);
    const counts = await getDBCounts();
    results.push(`📊 DB: ${JSON.stringify(counts)}`);
  } catch (err) {
    results.push(`❌ DB check failed: ${err.message}`);
  }

  results.push(await postAgentNote('=== Hourly Routine Complete ==='));
  return { ok: true, summary: results.join('\n') };
}

export async function runNightlyRoutine(options = { rotateFeatured: true, applyMargin: false, generateProducts: false }) {
  const results = [];
  results.push(await postAgentNote('=== Nightly Routine Start ==='));

  // Full audit
  const audit = await runSiteAudit();
  results.push(audit.summary);

  // Catalog sync
  const sync = await runCatalogSync();
  results.push(sync.summary);

  // Cleanup gibberish
  const cleanup = await cleanupGibberish();
  results.push(cleanup.summary);

  // Test endpoints
  const tests = await testEndpoints();
  results.push(tests.summary);

  // Optional: rotate featured (top 3 newest)
  if (options.rotateFeatured) {
    const featured = await featureRecentProducts(3);
    results.push(featured.summary);
  }

  // Optional: apply standard margin (only if needed)
  if (options.applyMargin) {
    const margin = await applyMargin(20);
    results.push(margin.summary);
  }

  // Optional: generate new products (light batch)
  if (options.generateProducts) {
    const gen = await generateNewProducts();
    results.push(gen.summary);
  }

  results.push(await postAgentNote('=== Nightly Routine Complete ==='));

  const fullReport = results.join('\n');

  // Persist report for UI retrieval
  try {
    await pool.query(
      `INSERT INTO routine_logs (routine_type, report, created_at) VALUES ($1, $2, NOW())`,
      ['nightly', fullReport]
    );
  } catch (err) {
    console.error('Failed to save nightly report:', err);
  }

  return { ok: true, summary: fullReport, report: fullReport };
}

export async function runOnDemandRoutine() {
  // Same as nightly, but with all optional steps enabled
  return runNightlyRoutine({
    rotateFeatured: true,
    applyMargin: false, // safe default
    generateProducts: false // don't auto-generate on demand unless explicitly asked
  });
}
