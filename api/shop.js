// api/shop.js - Unified shop catalog (Printify + local featured + price overrides) with cache mode
import pool from '../src/utils/db.js';
import fs from 'fs/promises';
import path from 'path';

const CACHE_FLAG_PATH = path.join(process.cwd(), '.cache-mode-enabled');
const CACHE_FILE_PATH = path.join(process.cwd(), 'shop-catalog-cache.json');

async function isCacheEnabled() {
  try {
    await fs.access(CACHE_FLAG_PATH);
    return true;
  } catch {
    return false;
  }
}

async function saveCatalogCache(catalog) {
  try {
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify({
      catalog,
      cached_at: new Date().toISOString()
    }));
  } catch (err) {
    console.error('Failed to save catalog cache:', err.message);
  }
}

async function loadCatalogCache() {
  try {
    const raw = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return data.catalog || [];
  } catch {
    return null;
  }
}

// Internal helper: fetch Printify catalog directly (bypasses auth middleware)
async function fetchPrintifyCatalog() {
  const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
  const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;

  if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID) {
    throw new Error('Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID');
  }

  const resp = await fetch(`https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json`, {
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Printify API ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const items = (data.data || data || []);
  console.log(`🌌 [NLBL Shop] Fetched ${items.length} products from Printify`);

  return items.map(p => {
    const { type, basePrice } = classifyProduct(p.title);
    const images = (p.images || []).map(img => img.src);
    return {
      id: p.id,
      title: p.title,
      description: p.description || '',
      category: type,
      price: (basePrice / 100).toFixed(2),
      priceCents: basePrice,
      image: images[0] || null,
      images,
      tags: p.tags || [],
      inStock: true
    };
  });
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

async function getMergedCatalog(cacheMode) {
  let printifyProducts;

  if (cacheMode) {
    const cached = await loadCatalogCache();
    if (cached?.length) {
      printifyProducts = cached;
    } else {
      printifyProducts = await fetchPrintifyCatalog();
      await saveCatalogCache(printifyProducts);
    }
  } else {
    printifyProducts = await fetchPrintifyCatalog();
    await saveCatalogCache(printifyProducts);
  }

  const dbResult = await pool.query(`
    SELECT printify_id, featured, price AS local_price, active AS local_active
    FROM products
    WHERE active = true OR featured = true
  `);

  const overrides = {};
  dbResult.rows.forEach(row => {
    overrides[row.printify_id] = {
      featured: row.featured,
      localPrice: row.local_price,
      active: row.local_active
    };
  });

  const merged = printifyProducts.map(p => {
    const o = overrides[p.id] || {};
    return {
      ...p,
      featured: !!o.featured,
      localPrice: o.localPrice || null,
      displayPrice: o.localPrice || p.price
    };
  });

  console.log(`🌌 [NLBL Shop] Merged catalog: ${merged.length} products (Printify: ${printifyProducts.length}, DB overrides: ${dbResult.rows.length})`);

  return merged.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.title || '').localeCompare(b.title || '');
  });
}

const actions = {
  list: async (req, res, cacheMode) => {
    try {
      const products = await getMergedCatalog(cacheMode);
      console.log(`🌌 [NLBL Shop] Action list: returning ${products.length} products`);
      return res.status(200).json({
        success: true,
        products,
        total: products.length,
        featuredCount: products.filter(p => p.featured).length,
        cacheMode
      });
    } catch (err) {
      console.error('Shop list error:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  get: async (req, res, cacheMode) => {
    const { id } = req.query;
    const products = await getMergedCatalog(cacheMode);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.status(200).json({ success: true, product });
  },

  featured: async (req, res, cacheMode) => {
    const products = await getMergedCatalog(cacheMode);
    return res.status(200).json({
      success: true,
      products: products.filter(p => p.featured)
    });
  },

  search: async (req, res, cacheMode) => {
    const { q } = req.query;
    const products = await getMergedCatalog(cacheMode);
    const filtered = products.filter(p =>
      p.title?.toLowerCase().includes(q?.toLowerCase()) ||
      p.description?.toLowerCase().includes(q?.toLowerCase())
    );
    return res.status(200).json({ success: true, products: filtered });
  },

  syncCatalog: async (req, res) => {
    try {
      const products = await fetchPrintifyCatalog();
      await saveCatalogCache(products);
      return res.status(200).json({ success: true, message: 'Catalog synced', count: products.length });
    } catch (err) {
      console.error('Sync error:', err);
      return res.status(500).json({ error: err.message });
    }
  },

  // Alias for syncCatalog (backward compatibility)
  sync: async (req, res) => {
    return actions.syncCatalog(req, res);
  },

  detail: async (req, res, cacheMode) => {
    const { id } = req.query;
    const products = await getMergedCatalog(cacheMode);
    const product = products.find(p => p.id === id);

    if (!product)
      return res.status(404).json({ error: 'Product not found' });

    return res.status(200).json({ success: true, product });
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action = 'list' } = req.query;
  const cacheMode = await isCacheEnabled();

  try {
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
