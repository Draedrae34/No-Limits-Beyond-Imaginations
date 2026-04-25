import { listPrintifyProducts, SHOP_ID } from './printify-client.js';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = await listPrintifyProducts(SHOP_ID);

    if (!data.data || !Array.isArray(data.data)) {
      return res.status(200).json({ products: [] });
    }

    const products = data.data.map(p => {
      // Get the first image from print areas
      let imageUrl = '';
      if (p.print_areas && p.print_areas[0] && p.print_areas[0].placeholders) {
        const placeholder = p.print_areas[0].placeholders.find(ph => ph.images && ph.images[0]);
        if (placeholder && placeholder.images[0]) {
          imageUrl = placeholder.images[0].src || '';
        }
      }

      // Get price from first variant
      const price = p.variants && p.variants[0] ? (p.variants[0].price || 0) / 100 : 0;

      return {
        id: p.id,
        title: p.title || 'Untitled Product',
        description: p.description || '',
        image: imageUrl,
        price: price,
        variants: p.variants ? p.variants.length : 0
      };
    });

    return res.status(200).json({ products });
  } catch (err) {
    console.error("List products error:", err);
    return res.status(500).json({ error: "Failed to load products" });
  }
}
