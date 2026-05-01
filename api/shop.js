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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cacheMode = await isCacheEnabled();

  try {
    let printifyProducts;

    if (cacheMode) {
      // Try cache first
      const cached = await loadCatalogCache();
      if (cached && cached.length) {
        printifyProducts = cached;
      } else {
        // Cache miss but in cache mode → still fetch live (graceful degradation)
        const data = await printify('catalog');
        printifyProducts = data?.catalog || [];
        await saveCatalogCache(printifyProducts);
      }
    } else {
      // Live mode — fetch fresh
      const data = await printify('catalog');
      printifyProducts = data?.catalog || [];
      // Also update cache for future use
      await saveCatalogCache(printifyProducts);
    }

    // Fetch local DB overrides
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

    // Merge
    const merged = printifyProducts.map(p => {
      const override = dbOverrides[p.id] || {};
      return {
        ...p,
        featured: !!override.featured,
        localPrice: override.localPrice || null,
        displayPrice: override.localPrice || p.price,
      };
    });

    // Sort: featured first, then title
    merged.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.title || '').localeCompare(b.title || '');
    });

    return res.status(200).json({
      products: merged,
      total: merged.length,
      featuredCount: merged.filter(p => p.featured).length,
      timestamp: new Date().toISOString(),
      cacheMode
    });
  } catch (err) {
    console.error('Shop merge error:', err);
    return res.status(500).json({ error: err.message });
  }
}
