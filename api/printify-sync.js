import { createPrintifyProduct, SHOP_ID } from './printify-client.js';
import { PRODUCT_TEMPLATES, toPrintifyPayload } from './product-templates.js';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { variantPrices } = req.body || {};
    const created = [];
    const errors = [];

    for (const template of PRODUCT_TEMPLATES) {
      try {
        const payload = toPrintifyPayload(template, variantPrices?.[template.slug]);
        const product = await createPrintifyProduct(SHOP_ID, payload);

        created.push({
          slug: template.slug,
          id: product.id,
          title: product.title,
          type: template.productType
        });
      } catch (err) {
        console.error(`Failed to create ${template.slug}:`, err.message);
        errors.push({ slug: template.slug, error: err.message });
      }
    }

    return res.status(200).json({
      ok: true,
      created,
      errors,
      message: `Created ${created.length} products, ${errors.length} errors.`
    });
  } catch (err) {
    console.error("Sync error:", err);
    return res.status(500).json({ error: "Sync failed" });
  }
}
