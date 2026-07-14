// api/workshop-product-tools.js
// Real tool implementations using your existing Printify API v4
import printify from '../utils/printify-actions.js';
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import { loadLogos, getThemeAssets } from '../utils/logo-loader.js';
import fs from 'fs/promises';
import path from 'path';

// Helper: get DB table counts for health monitoring
export async function getDBCounts() {
  const [products, messages, orders, routines] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM products'),
    pool.query('SELECT COUNT(*)::int AS count FROM messages'),
    pool.query('SELECT COUNT(*)::int AS count FROM orders'),
    pool.query('SELECT COUNT(*)::int AS count FROM routine_logs')
  ]);
  return {
    products: products.rows[0].count,
    messages: messages.rows[0].count,
    orders: orders.rows[0].count,
    routines: routines.rows[0].count,
  };
}

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

    const allAssets = loadLogos();
    const logos = allAssets.filter(asset => !asset.sourceDir.includes('galaxy-theme-assets'));
    const themes = getThemeAssets();
    if (!logos.length) return { ok: false, summary: 'No logos found in Logo_N_Galaxy_Fill_Space' };
    if (!themes.length) return { ok: false, summary: 'No galaxy theme assets found in public/galaxy-theme-assets' };

    const maxLogoVariants = Number(process.env.MAX_LOGO_VARIATIONS || 12);
    const selectedLogos = logos.slice(0, maxLogoVariants);
    const selectedThemes = themes.slice(0, Math.max(1, Math.min(4, Number(process.env.MAX_THEME_VARIATIONS || 4))));

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

        for (const selectedLogo of selectedLogos) {
          const selectedTheme = selectedThemes[Math.floor(Math.random() * selectedThemes.length)];
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
                images: [
                  { src: selectedTheme.publicUrl, x: 0.5, y: 0.5, scale: 1, angle: 0 },
                  { src: selectedLogo.publicUrl, x: 0.5, y: 0.5, scale: 0.75, angle: 0 },
                ],
              }],
            }],
            tags: ['No Limits', 'Galaxy', 'Memorial', 'Silent Spirits Legacy', type, selectedLogo.name, selectedTheme.name],
            visible: true,
            is_locked: false,
          };

          await printify('create', { productData: payload });
          createdCount++;

          // Also insert into local products DB for featured/management
          try {
            const printifyProductId = `${blueprint.id}_${selectedLogo.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${Date.now()}`;
            await pool.query(
              `INSERT INTO products (printify_id, name, description, price, category, image_url, active, featured) 
               VALUES ($1, $2, $3, $4, $5, $6, true, false)`,
              [
                printifyProductId,
                payload.title,
                payload.description,
                basePrice / 100,
                type,
                `${selectedTheme.publicUrl} | ${selectedLogo.publicUrl}`
              ]
            );
          } catch (dbErr) {
            console.warn('Failed to insert product into local DB:', dbErr.message);
          }
        }
      } catch (e) {
        errors.push(e.message);
      }
    }

    const summary = `Generated ${createdCount} products from ${selected.length} blueprints using ${selectedLogos.length} galaxy logo variants`;
    return { ok: true, summary: errors.length ? `${summary} (${errors.length} errors)` : summary };
  } catch (err) {
    console.error('generateNewProducts error:', err);
    return { ok: false, summary: `Generation failed: ${err.message}` };
  }
}

// Helper: timed fetch for latency tracking
async function timedFetch(name, url, resultsObj) {
  const start = Date.now();
  try {
    const res = await fetch(url);
    const latency = Date.now() - start;
    resultsObj[name] = {
      status: res.ok ? 'OK' : `ERROR ${res.status}`,
      latency,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    const latency = Date.now() - start;
    resultsObj[name] = {
      status: `FAIL: ${err.message}`,
      latency,
      timestamp: new Date().toISOString()
    };
  }
}

// ⭐ 4. runSiteAudit() – deeper audit with endpoint latency tracking
export async function runSiteAudit() {
  const results = { endpoints: {} };

  // Endpoint latency checks
  await timedFetch('shop', '/api/shop', results.endpoints);
  await timedFetch('printify-status', '/api/printify?action=status', results.endpoints);
  await timedFetch('products-list', '/api/printify?action=adminList', results.endpoints);
  await timedFetch('messages', '/api/messages', results.endpoints);
  await timedFetch('orders', '/api/orders', results.endpoints);
  await timedFetch('gallery', '/api/messages?action=galleryList', results.endpoints);

  // Env checks
  results.env = {
    PRINTIFY_API_KEY: process.env.PRINTIFY_API_KEY ? 'SET' : 'MISSING',
    PRINTIFY_SHOP_ID: process.env.PRINTIFY_SHOP_ID ? 'SET' : 'MISSING',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
  };

  // DB table counts
  try {
    await ensureProductsSchema(pool);
    const [{ count: products }] = await pool.query('SELECT COUNT(*)::int AS count FROM products');
    const [{ count: messages }] = await pool.query('SELECT COUNT(*)::int AS count FROM messages');
    const [{ count: orders }] = await pool.query('SELECT COUNT(*)::int AS count FROM orders');
    const [{ count: gallery }] = await pool.query('SELECT COUNT(*)::int AS count FROM gallery');
    results.db = { products, messages, orders, gallery };
  } catch (err) {
    results.db = `ERROR: ${err.message}`;
  }

  // Printify status
  try {
    const status = await printify('status');
    results.printify = {
      status: status?.status || 'unknown',
      shopId: process.env.PRINTIFY_SHOP_ID || 'unset',
      timestamp: status?.timestamp || 'n/a'
    };
  } catch (err) {
    results.printify = `ERROR: ${err.message}`;
  }

  // Filesystem checks (logo dir)
  try {
    const logoDir = path.join(process.cwd(), 'Logo_N_Galaxy_Fill_Space');
    const stats = await fs.stat(logoDir);
    const files = await fs.readdir(logoDir);
    results.filesystem = {
      logoDir: 'EXISTS',
      fileCount: files.length,
      sizeKB: Math.round((files.reduce((acc, f) => acc + stats.size, 0)) / 1024)
    };
  } catch (err) {
    results.filesystem = `ERROR: ${err.message}`;
  }

  // Summary text (dashboard-friendly)
  const endpointStatuses = Object.entries(results.endpoints).map(([k, v]) => `${k}:${v.status}(${v.latency}ms)`).join(' | ');
  const envOk = Object.values(results.env).filter(v => v === 'SET').length;
  const dbOk = typeof results.db === 'object' ? 1 : 0;
  const printOk = typeof results.printify === 'object' ? 1 : 0;
  const fsOk = typeof results.filesystem === 'object' ? 1 : 0;

  const summary = `Audit: env ${envOk}/3 | db ${dbOk}/1 | printify ${printOk}/1 | fs ${fsOk}/1 | endpoints: ${endpointStatuses}`;

  return { ok: true, summary, raw: results };
}

export async function testEndpoints() {
  const audit = await runSiteAudit();
  return {
    ok: audit.ok,
    summary: audit.summary,
    endpoints: audit.raw?.endpoints || {},
  };
}

// ⭐ 5. Monetary + shop integration tools

// Toggle featured status on recent products
export async function featureRecentProducts(count = 3) {
  try {
    const result = await pool.query(
      `UPDATE products SET featured = false WHERE featured = true`
    );
    const resetCount = result.rowCount || 0;

    const recent = await pool.query(
      `SELECT id FROM products WHERE active = true ORDER BY created_at DESC LIMIT $1`,
      [parseInt(count)]
    );
    const ids = recent.rows.map(r => r.id);

    if (ids.length) {
      await pool.query(
        `UPDATE products SET featured = true WHERE id = ANY($1)`,
        [ids]
      );
    }

    return { 
      ok: true, 
      summary: `Featured ${ids.length} new products (reset ${resetCount} previous).` 
    };
  } catch (err) {
    console.error('featureRecentProducts error:', err);
    return { ok: false, summary: `Feature toggle failed: ${err.message}` };
  }
}

// Set specific product as featured by ID
export async function setFeatured(productId, isFeatured = true) {
  try {
    await pool.query(
      `UPDATE products SET featured = $1 WHERE id = $2`,
      [isFeatured, productId]
    );
    return { 
      ok: true, 
      summary: `Product ${productId} featured = ${isFeatured}` 
    };
  } catch (err) {
    return { ok: false, summary: `Set featured failed: ${err.message}` };
  }
}

// Re-price products with margin logic
export async function applyMargin(markupPercent = 20) {
  try {
    const products = await pool.query('SELECT id, price FROM products WHERE active = true');
    const updated = [];
    for (const p of products.rows) {
      const newPrice = Math.round(p.price * (1 + markupPercent / 100) * 100) / 100;
      await pool.query('UPDATE products SET price = $1 WHERE id = $2', [newPrice, p.id]);
      updated.push(p.id);
    }
    return { 
      ok: true, 
      summary: `Applied ${markupPercent}% margin to ${updated.length} products.` 
    };
  } catch (err) {
    return { ok: false, summary: `Margin apply failed: ${err.message}` };
  }
}
