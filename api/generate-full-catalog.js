import { generateFullCatalogWithLogos } from '../utils/catalog-engine.js';
import { saveGeneratedProducts } from '../src/utils/products.js';
import { writeShopProductsJson } from '../src/utils/shop-json.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const options = req.body || {};
    const createdProducts = await generateFullCatalogWithLogos();

    // persist to DB
    const db = await (await import('../src/utils/db.js')).default;
    await saveGeneratedProducts(createdProducts, db);

    // write to shop-products.json for static fallback
    writeShopProductsJson(createdProducts);

    return res.status(200).json({
      ok: true,
      count: createdProducts.length,
      products: createdProducts,
    });
  } catch (err) {
    console.error('Full catalog generation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
