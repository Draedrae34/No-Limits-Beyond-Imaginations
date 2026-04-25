import fs from 'fs';
import path from 'path';

export function writeShopProductsJson(products) {
  const filePath = path.join(process.cwd(), 'shop-products.json');

  const payload = products.map(p => ({
    id: p.printifyId || p.id,
    title: p.title || 'Untitled Product',
    logoName: p.logoName || '',
    image: p.image || '',
    blueprintId: p.blueprintId,
    providerId: p.providerId,
    type: p.type || 'other'
  }));

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Wrote ${payload.length} products to shop-products.json`);
}

// Also update the Neon database
export async function saveGeneratedProducts(products, db) {
  for (const p of products) {
    try {
      await db.query(
        `INSERT INTO products (printify_id, blueprint_id, provider_id, logo_name, title, type)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (printify_id) DO UPDATE
         SET logo_name = EXCLUDED.logo_name,
             title = EXCLUDED.title,
             type = EXCLUDED.type`,
        [p.printifyId, p.blueprintId, p.providerId, p.logoName, p.title, p.type]
      );
    } catch (err) {
      console.error(`Failed to save product ${p.title}:`, err.message);
    }
  }
}
