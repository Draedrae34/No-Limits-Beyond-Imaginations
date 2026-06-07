// api/shop.js - Unified shop: public catalog + admin product management + Printify sync
import pool from '../src/utils/db.js';
import fs from 'fs/promises';
import path from 'path';
import { sendDiscordAlert } from '../utils/discord-alerts.js';
import { verifyAdmin } from '../src/utils/auth.js';
import { ensureProductsSchema, mapProductRow, pickIncomingImageUrl } from '../src/utils/products.js';

const CACHE_FLAG_PATH = path.join(process.cwd(), '.cache-mode-enabled');
const CACHE_FILE_PATH = path.join(process.cwd(), 'shop-catalog-cache.json');

async function isCacheEnabled() {
  try { await fs.access(CACHE_FLAG_PATH); return true; } catch { return false; }
}
async function saveCatalogCache(catalog) {
  try { await fs.writeFile(CACHE_FILE_PATH, JSON.stringify({ catalog, cached_at: new Date().toISOString() })); } catch (err) { console.error('Cache save failed:', err.message); }
}
async function loadCatalogCache() {
  try { const data = JSON.parse(await fs.readFile(CACHE_FILE_PATH, 'utf-8')); return data.catalog || []; } catch { return null; }
}

async function loadLocalCatalog() {
  const raw = await fs.readFile(path.join(process.cwd(), 'shop-products.json'), 'utf-8');
  const items = JSON.parse(raw);
  return items.filter(p => p.active !== false).map(p => ({
    id: String(p.id),
    title: p.title || p.name,
    description: p.description || '',
    category: p.category || 'Shop',
    price: Number(p.price || 0).toFixed(2),
    priceCents: Math.round(Number(p.price || 0) * 100),
    image: p.image_url || p.image || null,
    images: [p.image_url || p.image].filter(Boolean),
    tags: p.tags || [],
    inStock: true,
    featured: !!p.featured,
    localPrice: null,
    displayPrice: Number(p.price || 0).toFixed(2),
  }));
}

function classifyProduct(title) {
  const t = title.toLowerCase();
  if (t.includes('hoodie') || t.includes('sweatpant')) return { type: 'hoodie', basePrice: 4999 };
  if (t.includes('jogger') || t.includes('sweatpant')) return { type: 'jogger', basePrice: 4499 };
  if (t.includes('jacket') || t.includes('windbreaker')) return { type: 'jacket', basePrice: 5499 };
  if (t.includes('tank')) return { type: 'tank', basePrice: 2999 };
  if (t.includes('crop')) return { type: 'crop-top', basePrice: 3299 };
  if (t.includes('dress')) return { type: 'dress', basePrice: 4499 };
  if (t.includes('skirt')) return { type: 'skirt', basePrice: 3999 };
  if (t.includes('hat') || t.includes('cap') || t.includes('beanie')) return { type: 'hat', basePrice: 2499 };
  if (t.includes('bag') || t.includes('tote') || t.includes('backpack')) return { type: 'bag', basePrice: 2999 };
  if (t.includes('mug') || t.includes('cup')) return { type: 'mug', basePrice: 1999 };
  if (t.includes('poster') || t.includes('print') || t.includes('canvas')) return { type: 'wall-art', basePrice: 2999 };
  if (t.includes('sticker')) return { type: 'sticker', basePrice: 499 };
  if (t.includes('phone') || t.includes('case')) return { type: 'phone-case', basePrice: 1999 };
  return { type: 'tee', basePrice: 3499 };
}

async function fetchPrintifyCatalog() {
  const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
  const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;
  if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID) throw new Error('Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID');
  const resp = await fetch(`https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json`, {
    headers: { 'Authorization': `Bearer ${PRINTIFY_API_KEY}`, 'Content-Type': 'application/json' }
  });
  if (!resp.ok) throw new Error(`Printify API ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const items = (data.data || data || []);
  console.log(`🌌 [NLBL Shop] Fetched ${items.length} products from Printify`);
  return items.map(p => {
    const { type, basePrice } = classifyProduct(p.title);
    const images = (p.images || []).map(img => img.src);
    return { id: p.id, title: p.title, description: p.description || '', category: type, price: (basePrice / 100).toFixed(2), priceCents: basePrice, image: images[0] || null, images, tags: p.tags || [], inStock: true };
  });
}

async function printifyFetch(endpoint, method = 'GET', body = null) {
  const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
  const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;
  if (!PRINTIFY_API_KEY) throw new Error('PRINTIFY_API_KEY not set');
  const opts = { method, headers: { 'Authorization': `Bearer ${PRINTIFY_API_KEY}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const resp = await fetch(`https://api.printify.com/v1/${endpoint}`, opts);
  if (!resp.ok) throw new Error(`Printify API ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

async function getMergedCatalog(cacheMode) {
  let printifyProducts;
  try {
    if (cacheMode) {
      const cached = await loadCatalogCache();
      if (cached?.length) { printifyProducts = cached; } else { printifyProducts = await fetchPrintifyCatalog(); await saveCatalogCache(printifyProducts); }
    } else {
      printifyProducts = await fetchPrintifyCatalog();
      await saveCatalogCache(printifyProducts);
    }
  } catch (err) {
    console.warn('Printify catalog unavailable, using local catalog:', err.message);
    printifyProducts = await loadLocalCatalog();
  }

  let dbResult = { rows: [] };
  try {
    await ensureProductsSchema(pool);
    dbResult = await pool.query(`SELECT printify_id, featured, price AS local_price, active AS local_active FROM products WHERE active = true OR featured = true`);
  } catch (err) {
    console.warn('Product overrides unavailable, serving catalog without DB overrides:', err.message);
  }
  const overrides = {};
  dbResult.rows.forEach(row => { overrides[row.printify_id] = { featured: row.featured, localPrice: row.local_price, active: row.local_active }; });
  const merged = printifyProducts.map(p => {
    const o = overrides[p.id] || {};
    return { ...p, featured: !!o.featured, localPrice: o.localPrice || null, displayPrice: o.localPrice || p.price };
  });
  console.log(`🌌 [NLBL Shop] Merged: ${merged.length} products (Printify: ${printifyProducts.length}, DB: ${dbResult.rows.length})`);
  return merged.sort((a, b) => { if (a.featured && !b.featured) return -1; if (!a.featured && b.featured) return 1; return (a.title || '').localeCompare(b.title || ''); });
}

const actions = {
  // Public actions
  list: async (req, res, cacheMode) => {
    const products = await getMergedCatalog(cacheMode);
    return res.status(200).json({ success: true, products, total: products.length, featuredCount: products.filter(p => p.featured).length, cacheMode });
  },
  get: async (req, res, cacheMode) => {
    const { id } = req.query;
    const products = await getMergedCatalog(cacheMode);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.status(200).json({ success: true, product });
  },
  featured: async (req, res, cacheMode) => {
    const products = (await getMergedCatalog(cacheMode)).filter(p => p.featured);
    return res.status(200).json({ success: true, products: products });
  },
  search: async (req, res, cacheMode) => {
    const { q } = req.query;
    const products = await getMergedCatalog(cacheMode);
    const filtered = products.filter(p => p.title?.toLowerCase().includes(q?.toLowerCase()) || p.description?.toLowerCase().includes(q?.toLowerCase()));
    return res.status(200).json({ success: true, products: filtered });
  },
  syncCatalog: async (req, res) => {
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Authentication required' });
    const products = await fetchPrintifyCatalog();
    await saveCatalogCache(products);
    return res.status(200).json({ success: true, message: 'Catalog synced', count: products.length });
  },
  sync: async (req, res) => { return actions.syncCatalog(req, res); },
  detail: async (req, res, cacheMode) => {
    const { id } = req.query;
    const products = await getMergedCatalog(cacheMode);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.status(200).json({ success: true, product });
  },

  // Admin: Local product CRUD (merged from products/[id].js)
  adminProduct: async (req, res) => {
    const { id } = req.query;
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Authentication required' });

    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
      return res.status(200).json({ success: true, product: mapProductRow(result.rows[0]) });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const { name, description, price, category, featured } = body;
      const active = typeof body.active === 'boolean' ? body.active : null;
      const { imageUrl } = pickIncomingImageUrl(body);
      const result = await pool.query(
        `UPDATE products SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price), category = COALESCE($4, category), image_url = COALESCE($5, image_url, image_filename), image_filename = COALESCE($5, image_filename, image_url), active = COALESCE($6, active), featured = COALESCE($7, featured) WHERE id = $8 RETURNING *`,
        [name ?? null, description ?? null, price ?? null, category ?? null, imageUrl ?? null, active, featured, id]
      );
      if (!result.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
      return res.status(200).json({ success: true, product: mapProductRow(result.rows[0]) });
    }

    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  },

  // Admin: Printify API proxy (merged from printify.js)
  printifyAdmin: async (req, res) => {
    if (!(await verifyAdmin(req))) return res.status(401).json({ error: 'Authentication required' });
    let body = req.body || {};
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const action = (req.query && (req.query.printifyAction || req.query.action)) || (body && body.action) || 'status';

    try {
      switch (action) {
        case 'status': {
          const hasKey = !!process.env.PRINTIFY_API_KEY;
          const hasShop = !!process.env.PRINTIFY_SHOP_ID;
          let shopInfo = null;
          if (hasKey) {
            try {
              const shops = await printifyFetch('shops.json');
              shopInfo = shops.find(s => String(s.id) === String(process.env.PRINTIFY_SHOP_ID)) || shops[0] || null;
            } catch (e) { shopInfo = { error: e.message }; }
          }
          return res.status(200).json({ status: hasKey && hasShop ? 'connected' : 'not_configured', hasApiKey: hasKey, hasShopId: hasShop, shop: shopInfo, availableActions: ['status', 'catalog', 'list', 'sync', 'import', 'adminList'], timestamp: new Date().toISOString() });
        }
        case 'list': {
          if (!process.env.PRINTIFY_API_KEY || !process.env.PRINTIFY_SHOP_ID) return res.status(400).json({ error: 'Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID' });
          const products = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products.json`);
          const items = (products.data || products || []).map(p => ({ id: p.id, title: p.title, description: p.description, tags: p.tags, images: (p.images || []).map(img => img.src), variants: (p.variants || []).length, ...classifyProduct(p.title) }));
          return res.status(200).json({ count: items.length, products: items, timestamp: new Date().toISOString() });
        }
        case 'catalog': {
          if (!process.env.PRINTIFY_API_KEY || !process.env.PRINTIFY_SHOP_ID) return res.status(400).json({ error: 'Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID' });
          const products = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products.json`);
          const catalog = (products.data || products || []).map(p => {
            const { type, basePrice } = classifyProduct(p.title);
            const images = (p.images || []).map(img => img.src);
            return { id: p.id, title: p.title, description: p.description || '', category: type, price: (basePrice / 100).toFixed(2), priceCents: basePrice, image: images[0] || null, images, tags: p.tags || [], inStock: true };
          });
          return res.status(200).json({ catalog });
        }
        case 'sync': {
          const dryRun = (req.query && req.query.dryRun === 'true') || (body && body.dryRun === true);
          const products = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products.json`);
          const items = (products.data || products || []);
          const results = items.map(p => { const { type, basePrice } = classifyProduct(p.title); return { id: p.id, title: p.title, category: type, price: (basePrice / 100).toFixed(2), images: (p.images || []).length, status: dryRun ? 'would_sync' : 'synced' }; });
          return res.status(200).json({ mode: dryRun ? 'dry_run' : 'live', total: results.length, results, message: dryRun ? `Dry run: ${results.length} products would sync.` : `${results.length} products synced.`, timestamp: new Date().toISOString() });
        }
        case 'import': {
          const products = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products.json`);
          const items = (products.data || products || []);
          return res.status(200).json({ imported: items.length, products: items.map(p => ({ id: p.id, title: p.title, ...classifyProduct(p.title) })), message: `${items.length} products imported.`, timestamp: new Date().toISOString() });
        }
        case 'adminList': {
          const page = parseInt(req.query.page) || 1;
          const limit = parseInt(req.query.limit) || 20;
          const url = `shops/${process.env.PRINTIFY_SHOP_ID}/products.json?page=${page}&limit=${limit}`;
          const response = await fetch(`https://api.printify.com/v1/${url}`, { headers: { 'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`, 'Content-Type': 'application/json' } });
          if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ success: false, error: `Printify API error: ${response.status}`, details: errText });
          }
          const data = await response.json();
          const products = (data.data || []).map(p => ({
            id: p.id, title: p.title, description: p.description || "", tags: p.tags || [],
            images: (p.images || []).map(img => ({ src: img.src, is_default: img.is_default })),
            variants: (p.variants || []).map(v => ({ id: v.id, title: v.title, price: v.price, is_enabled: v.is_enabled })),
            created_at: p.created_at, visible: p.visible, is_locked: p.is_locked
          }));
          console.log(`🌌 [NLBL Printify] Admin list: page=${page}, limit=${limit}, total=${data.total || products.length}`);
          return res.status(200).json({ success: true, products, total: data.total || products.length, page, limit });
        }
        case 'blueprints': {
          const data = await printifyFetch('catalog/blueprints.json');
          const blueprints = data.data || data || [];
          return res.status(200).json({
            success: true,
            count: blueprints.length,
            blueprints,
            timestamp: new Date().toISOString()
          });
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}`, availableActions: ['status', 'catalog', 'list', 'sync', 'import', 'adminList', 'blueprints'] });
      }
    } catch (err) {
      console.error('Printify API Error:', err.message);
      return res.status(500).json({ error: err.message, action, timestamp: new Date().toISOString() });
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action = 'list', id } = req.query;
  const cacheMode = await isCacheEnabled();

  try {
    // Route: admin product CRUD -> /api/shop?id=xxx&action=adminProduct (method: GET/PUT/DELETE)
    if (action === 'adminProduct' && id) {
      return await actions.adminProduct({ ...req, query: { ...req.query, id } }, res);
    }

    // Route: Printify admin proxy -> /api/shop?action=printifyAdmin (requires auth)
    if (action === 'printifyAdmin') {
      return await actions.printifyAdmin(req, res);
    }

    // Public catalog routes
    if (actions[action]) {
      console.log(`✨ [NLBL Shop Engine] Action: ${action}`);
      return await actions[action](req, res, cacheMode);
    }

    return res.status(400).json({ error: `Unknown action '${action}'` });
  } catch (err) {
    console.error('✨ [NLBL Shop Engine] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
