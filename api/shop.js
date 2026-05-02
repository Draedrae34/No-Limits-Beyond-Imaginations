// api/shop.js - Unified shop catalog (Printify + local featured + price overrides) with cache mode
import printify from './printify.js';
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

async function getMergedCatalog(cacheMode) {
  let printifyProducts;

  if (cacheMode) {
    const cached = await loadCatalogCache();
    if (cached?.length) {
      printifyProducts = cached;
    } else {
      const data = await printify('catalog');
      printifyProducts = data?.catalog || [];
      await saveCatalogCache(printifyProducts);
    }
  } else {
    const data = await printify('catalog');
    printifyProducts = data?.catalog || [];
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

  return merged.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.title || '').localeCompare(b.title || '');
  });
}

const actions = {
  list: async (req, res, cacheMode) => {
    const products = await getMergedCatalog(cacheMode);
    return res.status(200).json({
      success: true,
      products,
      total: products.length,
      featuredCount: products.filter(p => p.featured).length,
      cacheMode
    });
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
    console.log('✨ [NLBL Shop Engine] Syncing catalog...');
    const data = await printify('catalog');
    const products = data?.catalog || [];
    await saveCatalogCache(products);
    return res.status(200).json({ success: true, message: 'Catalog synced' });
  },

  // ⭐ MERGED PRODUCT DETAIL
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
      return await actionsaction;
    }
    return res.status(400).json({ error: `Unknown action '${action}'` });
  } catch (err) {
    console.error('✨ [NLBL Shop Engine] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
