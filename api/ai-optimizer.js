// api/ai-optimizer.js - AI-driven product optimization
// Uses rule-based optimization (no external API calls, runs locally)
import pool from '../src/utils/db.js';
import { ensureProductsSchema } from '../src/utils/products.js';

const COSMIC_ADJECTIVES = [
  "Celestial", "Cosmic", "Ethereal", "Stellar", "Nebula", "Galactic",
  "Astral", "Interstellar", "Transcendent", "Eternal", "Infinite", "Quantum"
];

const COSMIC_NOUNS = [
  "Legacy", "Memorial", "Horizon", "Voyage", "Odyssey", "Tribute",
  "Remembrance", "Ascension", "Evolution", "Infinity", "Beyond", "Eternity"
];

function enhanceDescription(baseDesc, productName) {
  const adjectives = COSMIC_ADJECTIVES.sort(() => 0.5 - Math.random()).slice(0, 2);
  const nouns = COSMIC_NOUNS.sort(() => 0.5 - Math.random()).slice(0, 1);
  const cosmicFlair = `${adjectives.join(' ')} ${nouns[0]}`;
  return `${baseDesc || productName}. ${cosmicFlair} craftsmanship. No Limits Beyond Limitations.`;
}

function suggestPrice(currentPrice, category = 'other') {
  // Apply 20% margin if not already priced
  const markup = currentPrice < 10 ? 0.25 : 0.20;
  const suggested = Math.round(currentPrice * (1 + markup) * 100) / 100;
  return {
    current: currentPrice,
    suggested,
    markupPercent: markup * 100,
    reason: 'Standard 20% margin applied'
  };
}

function suggestCategory(title, tags = []) {
  const lower = title.toLowerCase();
  if (lower.includes('hoodie')) return 'hoodie';
  if (lower.includes('sweatshirt')) return 'sweatshirt';
  if (lower.includes('t-shirt') || lower.includes('tee')) return 'tee';
  if (lower.includes('hat') || lower.includes('cap')) return 'hat';
  if (lower.includes('poster')) return 'poster';
  if (tags.includes('Memorial')) return 'memorial';
  return 'cosmic';
}

export async function optimizeProduct(productId) {
  await ensureProductsSchema(pool);
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
  if (!result.rows.length) return { ok: false, error: 'Product not found' };

  const product = result.rows[0];
  const changes = {};

  // 1. Price optimization
  const priceSuggestion = suggestPrice(Number(product.price));
  if (priceSuggestion.suggested > product.price) {
    changes.price = priceSuggestion;
  }

  // 2. Category refinement
  const category = suggestCategory(product.name, product.category ? [product.category] : []);
  if (category !== product.category) {
    changes.category = category;
  }

  // 3. Description enhancement (if short)
  if ((product.description?.length || 0) < 50) {
    const newDesc = enhanceDescription(product.description, product.name);
    changes.description = newDesc;
  }

  // Apply changes if any
  if (Object.keys(changes).length) {
    await pool.query(
      `UPDATE products SET 
        price = COALESCE($1, price),
        category = COALESCE($2, category),
        description = COALESCE($3, description)
       WHERE id = $4`,
      [changes.price?.suggested, changes.category, changes.description, productId]
    );
  }

  return { ok: true, productId, changesApplied: Object.keys(changes).length, changes };
}

export async function runBatchOptimization(limit = 20) {
  await ensureProductsSchema(pool);
  const result = await pool.query(
    `SELECT id, name, description, price, category FROM products WHERE active = true ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  const products = result.rows;
  const optimized = [];
  for (const p of products) {
    const opt = await optimizeProduct(p.id);
    if (opt.ok && opt.changesApplied) optimized.push(opt);
  }
  return { ok: true, total: products.length, optimized: optimized.length, details: optimized };
}

export async function getAIOptimizationStatus() {
  await ensureProductsSchema(pool);
  const result = await pool.query(`
    SELECT COUNT(*)::int AS total_products,
           COUNT(CASE WHEN description IS NULL OR LENGTH(description) < 50 THEN 1 END)::int AS needs_description,
           COUNT(CASE WHEN price < 10 THEN 1 END)::int AS low_price_count,
           COUNT(CASE WHEN category IS NULL THEN 1 END)::int AS uncategorized
    FROM products WHERE active = true
  `);
  const stats = result.rows[0];
  return { ok: true, stats };
}
