// api/shop.js - Unified shop catalog (Printify + local featured + price overrides)
import printify from './printify.js';
import pool from '../src/utils/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Fetch Printify catalog
    const printifyData = await printify('catalog');
    const printifyProducts = Array.isArray(printifyData.catalog) ? printifyData.catalog : [];

    // Fetch local DB overrides (featured, custom price)
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

    // Merge: Printify products + local flags
    const merged = printifyProducts.map(p => {
      const override = dbOverrides[p.id] || {};
      return {
        ...p,
        featured: !!override.featured,
        localPrice: override.localPrice || null,
        // Use local price if set, otherwise Printify's price
        displayPrice: override.localPrice || p.price,
      };
    });

    // Sort: featured first, then by title
    merged.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return (a.title || '').localeCompare(b.title || '');
    });

    return res.status(200).json({
      products: merged,
      total: merged.length,
      featuredCount: merged.filter(p => p.featured).length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Shop merge error:', err);
    return res.status(500).json({ error: err.message });
  }
}
