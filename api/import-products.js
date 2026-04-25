import pool from '../src/utils/db.js';
import { ensureProductsSchema, mapProductRow } from '../src/utils/products.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await ensureProductsSchema(pool);

    // Read products from shop-products.json
    const filePath = path.join(process.cwd(), 'shop-products.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const products = JSON.parse(fileContent);

    let imported = 0;
    let skipped = 0;

    for (const product of products) {
      // Check if product already exists
      const existing = await pool.query(
        'SELECT id FROM products WHERE name = $1',
        [product.name]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      await pool.query(
        `INSERT INTO products (name, description, price, category, image_url, image_filename, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          product.name,
          product.description || '',
          product.price,
          product.category || null,
          product.image_url || null,
          product.image_url || null,
          product.active !== false
        ]
      );
      imported++;
    }

    return res.status(200).json({
      success: true,
      imported,
      skipped,
      message: `Imported ${imported} products, skipped ${skipped} existing products.`
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ success: false, error: 'Failed to import products' });
  }
}
