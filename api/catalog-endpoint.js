import { getAllCatalogData } from './printify-catalog.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const catalog = await getAllCatalogData();

    // Simplify the response
    const simplified = {
      blueprints: catalog.blueprints.map(b => ({
        id: b.blueprint.id,
        title: b.blueprint.title,
        type: b.blueprint.type,
        providers: b.providers.map(p => ({
          id: p.id,
          title: p.title,
          variants: p.variants?.map(v => ({
            id: v.id,
            title: v.title,
            options: v.options
          })) || []
        }))
      }),
      allProviders: catalog.allProviders,
      fetchedAt: new Date(catalog.fetchedAt).toISOString()
    };

    return res.status(200).json(simplified);
  } catch (err) {
    console.error('Catalog endpoint error:', err);
    return res.status(500).json({ error: 'Failed to load catalog' });
  }
}
