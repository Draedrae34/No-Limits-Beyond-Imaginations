// api/shop.js - Unified Shop Catalog + Product Detail (DB-backed, cosmic theme)
// Actions: list, get, featured, search, syncCatalog, detail (alias for get)
import printify from './printify.js';
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';
import { getCatalogCache, setCatalogCache } from './auto-tuner.js';

async function isCacheEnabled() {
  await ensureProductsSchema(pool);
  const res = await pool.query(`SELECT cache_mode_enabled FROM adaptive_config WHERE id = 1`);
  return res.rows[0]?.cache_mode_enabled || false;
}

async function getMergedCatalog(cacheMode) {
  let printifyProducts;
  if (cacheMode) {
    const cached = await getCatalogCache();
    if (cached && cached.length) {
      printifyProducts = cached;
    } else {
      const data = await printify('catalog');
      printifyProducts = data?.catalog || [];
      await setCatalogCache(printifyProducts);
    }
  } else {
    const data = await printify('catalog');
    printifyProducts = data?.catalog || [];
    await setCatalogCache(printifyProducts);
  }

  const dbResult = await pool.query(`
    SELECT printify_id, featured, price AS local_price, active AS local_active
    FROM products
    WHERE active = true OR featured = true
  `);

  const dbOverrides = {};
  dbResult.rows.forEach(row => {
    if (row.printify_id) {
      dbOverrides[row.printify_id] = {
        featured: row.featured,
        localPrice: row.local_price,
        active: row.local_active
      };
    }
  });

  const merged = printifyProducts.map(p => {
    const override = dbOverrides[p.id] || {};
    return {
      ...p,
      featured: !!override.featured,
      localPrice: override.localPrice || null,
      displayPrice: override.localPrice || p.price,
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
    if (!product) return res.status(404).json({ error: 'Product not found in cosmic stream' });
    return res.status(200).json({ success: true, product });
  },

  // Alias for get (product-detail compatibility)
  detail: async (req, res, cacheMode) => {
    const { id } = req.query;
    const products = await getMergedCatalog(cacheMode);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found in cosmic stream' });
    return res.status(200).json({ success: true, product });
  },

  featured: async (req, res, cacheMode) => {
    const products = await getMergedCatalog(cacheMode);
    const featured = products.filter(p => p.featured);
    return res.status(200).json({ success: true, products: featured });
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
    console.log('🌌 [NLBL Shop Engine] Force-syncing cosmic catalog...');
    const data = await printify('catalog');
    const products = data?.catalog || [];
    await setCatalogCache(products);
    return res.status(200).json({ success: true, message: 'Catalog synced with the void' });
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
    return res.status(400).json({ error: `Action '${action}' unknown in shop engine` });
  } catch (err) {
    console.error('🌌 [NLBL Shop Engine] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
