// api/workshop-product-tools.js
// Real tool implementations using your existing Printify API v4
import printify from './printify.js';
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import { loadLogos } from '../utils/logo-loader.js';

// Helper: classify product type for price/margin logic
function classifyProduct(title) {
  const t = title.toLowerCase();
  if (t.includes('hoodie')) return { type: 'hoodie', basePrice: 6500 };
  if (t.includes('sweatshirt')) return { type: 'sweatshirt', basePrice: 5500 };
  if (t.includes('t-shirt') || t.includes('tee')) return { type: 'tee', basePrice: 3000 };
  if (t.includes('jogger') || t.includes('pants')) return { type: 'joggers', basePrice: 4800 };
  if (t.includes('hat') || t.includes('cap')) return { type: 'hat', basePrice: 2800 };
  if (t.includes('poster') || t.includes('canvas')) return { type: 'poster', basePrice: 2500 };
  if (t.includes('sticker')) return { type: 'sticker', basePrice: 1800 };
  if (t.includes('tumbler') || t.includes('mug')) return { type: 'tumbler', basePrice: 3000 };
  if (t.includes('backpack')) return { type: 'backpack', basePrice: 5500 };
  if (t.includes('phone case')) return { type: 'phone_case', basePrice: 3000 };
  return { type: 'other', basePrice: 3500 };
}

// ⭐ 1. runCatalogSync() – uses your v4 actions: catalog + sync + import
export async function runCatalogSync() {
  try {
    const catalogResult = await printify('catalog');
    const catalog = catalogResult?.catalog || [];
    const catalogCount = catalog.length;

    const syncResult = await printify('sync');
    const syncCount = syncResult?.total || syncResult?.results?.length || 0;

    const importResult = await printify('import');
    const importCount = importResult?.imported || 0;

    return {
      ok: true,
      summary: `Catalog: ${catalogCount} items | Sync: ${syncCount} synced | Import: ${importCount} new products`
    };
  } catch (err) {
    console.error('runCatalogSync error:', err);
    return { ok: false, summary: `Catalog sync failed: ${err.message}` };
  }
}

// ⭐ 2. cleanupGibberish() – uses your cleanup logic
// Note: your api/printify.js doesn't have cleanup-scan/delete actions yet.
// This uses pattern-based detection on local products (safe/logical).
function isGibberish(name) {
  if (!name) return true;
  if (name.length < 4) return true;
  if (/[^a-zA-Z0-9\s]/.test(name)) return false;
  if (/\s/.test(name)) return false;
  if (/[AEIOUaeiou]/.test(name)) return false;
  if (name === name.toUpperCase() && name.length <= 6) return false;
  return true;
}

export async function cleanupGibberish() {
  try {
    await ensureProductsSchema(pool);
    const result = await pool.query('SELECT id, name FROM products');
    const rows = result.rows;
    const gibberish = rows.filter(r => isGibberish(r.name));

    if (gibberish.length > 0) {
      const ids = gibberish.map(r => r.id);
      await pool.query('DELETE FROM products WHERE id = ANY($1)', [ids]);
    }

    return { ok: true, summary: `Removed ${gibberish.length} local gibberish products` };
  } catch (err) {
    console.error('cleanupGibberish error:', err);
    return { ok: false, summary: `Cleanup failed: ${err.message}` };
  }
}

// ⭐ 3. generateNewProducts() – uses your blueprint + design generation pipeline
export async function generateNewProducts() {
  try {
    const blueprintsResult = await printify('blueprints');
    const blueprints = blueprintsResult?.data || blueprintsResult || [];
    if (!blueprints.length) return { ok: false, summary: 'No blueprints available from Printify' };

    const selected = blueprints.sort(() => 0.5 - Math.random()).slice(0, 5);

    const logos = loadLogos();
    if (!logos.length) return { ok: false, summary: 'No logos found in Logo_N_Galaxy_Fill_Space' };
    const selectedLogo = logos[Math.floor(Math.random() * logos.length)];

    let createdCount = 0;
    const errors = [];

    for (const blueprint of selected) {
      try {
        const providersResult = await printify('blueprint-details', { blueprintId: blueprint.id });
        const providers = providersResult?.print_providers || [];
        if (!providers.length) continue;

        const provider = providers[0];
        const variantsResult = await printify('variants', { blueprintId: blueprint.id, providerId: provider.id });
        const variants = variantsResult?.variants || [];
        if (!variants.length) continue;

        const { type, basePrice } = classifyProduct(blueprint.title);
        const payload = {
          title: `${selectedLogo.name} – ${blueprint.title}`,
          description: `No Limits Beyond Limitations • Silent Spirits Legacy • ${blueprint.title} • ${selectedLogo.name}`,
          blueprint_id: blueprint.id,
          print_provider_id: provider.id,
          variants: variants.map(v => ({ id: v.id, price: v.price || basePrice, is_enabled: true })),
          print_areas: [{
            variant_ids: variants.map(v => v.id),
            placeholders: [{
              position: 'front',
              images: [{ src: selectedLogo.publicUrl, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
            }],
          }],
          tags: ['No Limits', 'Galaxy', 'Memorial', 'Silent Spirits Legacy', type],
          visible: true,
          is_locked: false,
        };

        await printify('create', { productData: payload });
        createdCount++;
      } catch (e) {
        errors.push(e.message);
      }
    }

    const summary = `Generated ${createdCount} products from ${selected.length} blueprints`;
    return { ok: true, summary: errors.length ? `${summary} (${errors.length} errors)` : summary };
  } catch (err) {
    console.error('generateNewProducts error:', err);
    return { ok: false, summary: `Generation failed: ${err.message}` };
  }
}

// ⭐ 4. runSiteAudit() – checks all major endpoints and env
export async function runSiteAudit() {
  const checks = {};

  checks['PRINTIFY_API_KEY'] = process.env.PRINTIFY_API_KEY ? 'SET' : 'MISSING';
  checks['PRINTIFY_SHOP_ID'] = process.env.PRINTIFY_SHOP_ID ? 'SET' : 'MISSING';
  checks['DATABASE_URL'] = process.env.DATABASE_URL ? 'SET' : 'MISSING';

  try {
    await pool.query('SELECT 1');
    checks['PostgreSQL'] = 'CONNECTED';
  } catch (e) {
    checks['PostgreSQL'] = `ERROR: ${e.message}`;
  }

  try {
    const res = await fetch('/api/printify?action=status');
    checks['Printify API'] = res.ok ? 'OK' : `HTTP ${res.status}`;
  } catch (e) {
    checks['Printify API'] = `FAIL: ${e.message}`;
  }

  try {
    const logos = loadLogos();
    checks['Logo Files'] = `${logos.length} loaded`;
  } catch (e) {
    checks['Logo Files'] = `ERROR: ${e.message}`;
  }

  const passed = Object.values(checks).filter(v => v === 'SET' || v === 'CONNECTED' || v === 'OK' || v.includes('loaded')).length;
  return { ok: true, summary: `Audit: ${passed}/${Object.keys(checks).length} checks passed\n` + Object.entries(checks).map(([k, v]) => `  ${k}: ${v}`).join('\n') };
}

// ⭐ 5. testEndpoints() – pings all API routes
export async function testEndpoints() {
  const endpoints = [
    '/api/printify?action=status',
    '/api/printify?action=catalog',
    '/api/printify?action=list',
    '/api/printify?action=sync',
    '/api/printify?action=import',
    '/api/orders',
    '/api/messages',
    '/api/gallery',
    '/api/products-list',
  ];

  const results = {};

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      results[url] = res.ok ? 'OK' : `ERROR ${res.status}`;
    } catch (err) {
      results[url] = `FAIL: ${err.message}`;
    }
  }

  const passed = Object.values(results).filter(v => v === 'OK').length;
  return { ok: true, summary: `Endpoint test: ${passed}/${endpoints.length} OK\n` + Object.entries(results).map(([k, v]) => `  ${k}: ${v}`).join('\n') };
}
