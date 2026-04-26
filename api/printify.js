// api/printify.js - Consolidated Printify API
// Replaces: catalog-endpoint.js, generate-full-catalog.js, import-products.js,
//            printify-catalog.js, printify-client.js, sync-engine.js

import { SHOP_ID, printifyRequest, createPrintifyProduct } from './printify-client.js';
import { loadLogos } from '../utils/logo-loader.js';
import { writeShopProductsJson } from '../src/utils/shop-json.js';
import { saveGeneratedProducts } from '../src/utils/products.js';

// Get all logos from Logo_N_Galaxy_Fill_Space folder
function getGalaxyLogos() {
  return loadLogos();
}

// Calculate price based on product type
function calculatePrice(blueprintTitle) {
  const title = blueprintTitle.toLowerCase();
  if (title.includes('hoodie')) return 6500;
  if (title.includes('t-shirt') || title.includes('tee')) return 3500;
  if (title.includes('jogger')) return 5500;
  if (title.includes('phone case')) return 2999;
  if (title.includes('poster')) return 2499;
  if (title.includes('sticker')) return 1799;
  if (title.includes('hat')) return 3499;
  if (title.includes('tumbler')) return 3999;
  if (title.includes('backpack')) return 6999;
  return 4500; // default
}

// Generate product payload for a specific combination
function generateProductPayload(blueprint, provider, variant, logo) {
  const blueprintTitle = blueprint.title || 'Product';
  const variantOptions = variant.options || {};

  return {
    title: `${blueprintTitle} - ${logo.name}`,
    description: `Cosmic ${blueprintTitle} with ${logo.name} galaxy design`,
    blueprint_id: blueprint.id,
    print_provider_id: provider.id,
    variants: [{
      id: variant.id,
      price: calculatePrice(blueprintTitle),
      is_enabled: true,
      options: variantOptions
    }],
    print_areas: [{
      variant_ids: [variant.id],
      placeholders: [{
        position: 'front',
        images: [{
          src: logo.publicUrl || logo.path,
          x: 0.5,
          y: 0.5,
          scale: 1.0,
          angle: 0
        }]
      }]
    }],
    tags: ['No Limits', 'Galaxy', 'Memorial', 'Silent Spirits Legacy'],
    visible: true,
    is_locked: false,
  };
}

// Main sync engine
export async function fullSyncEngine(options = {}) {
  const {
    dryRun = false,
    limitBlueprints,
    limitLogos,
    specificTypes
  } = options;

  const results = {
    catalog: { blueprints: 0, providers: 0 },
    logos: 0,
    generated: [],
    created: [],
    errors: [],
    stats: {
      totalCombinations: 0,
      productsCreated: 0,
      errors: 0
    }
  };

  try {
    // Import catalog functions dynamically to avoid circular dependencies
    const { getAllCatalogData } = await import('./printify-catalog.js');
    
    console.log('Loading full Printify catalog...');
    const catalog = await getAllCatalogData();
    results.catalog.blueprints = catalog.blueprints.length;
    results.catalog.providers = catalog.allProviders.length;

    console.log(`Got ${catalog.blueprints.length} blueprints, ${catalog.allProviders.length} providers`);

    const logos = getGalaxyLogos();
    results.logos = logos.length;
    console.log(`Got ${logos.length} galaxy logos`);

    if (limitLogos && limitLogos < logos.length) {
      logos.splice(limitLogos);
      console.log(`Limited to ${limitLogos} logos`);
    }

    let blueprints = catalog.blueprints;
    if (limitBlueprints) {
      blueprints = blueprints.slice(0, limitBlueprints);
    }

    if (specificTypes) {
      const types = Array.isArray(specificTypes) ? specificTypes : [specificTypes];
      blueprints = blueprints.filter(b =>
        types.some(t => b.blueprint?.title?.toLowerCase().includes(t.toLowerCase()))
      );
    }

    console.log(`Processing ${blueprints.length} blueprints...`);

    for (const bpWrapper of blueprints) {
      const blueprint = bpWrapper.blueprint;
      const providers = bpWrapper.providers || [];

      if (!providers.length) {
        console.log(`Skip ${blueprint.title}: no providers`);
        continue;
      }

      for (const logo of logos) {
        for (const provider of providers) {
          const variants = provider.variants || [];

          if (!variants.length) {
            continue;
          }

          for (const variant of variants) {
            results.stats.totalCombinations++;

            const payload = generateProductPayload(blueprint, provider, variant, logo);

            if (dryRun) {
              results.generated.push({
                title: payload.title,
                blueprint: blueprint.title,
                logo: logo.name,
                provider: provider.title,
                variant: variant.title || variant.options
              });
              continue;
            }

            try {
              const created = await createPrintifyProduct(SHOP_ID, payload);
              results.created.push({
                id: created.id,
                title: payload.title,
                blueprint: blueprint.title,
                logo: logo.name
              });
              results.stats.productsCreated++;
            } catch (err) {
              results.errors.push({
                title: payload.title,
                error: err.message
              });
              results.stats.errors++;
            }
          }
        }
      }
    }

    return results;

  } catch (error) {
    console.error('Full sync error:', error);
    throw error;
  }
}

// Catalog endpoint
export async function getCatalog() {
  const { getAllCatalogData } = await import('./printify-catalog.js');
  const catalog = await getAllCatalogData();

  return {
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
    })),
    allProviders: catalog.allProviders,
    fetchedAt: new Date(catalog.fetchedAt).toISOString()
  };
}

// Products list endpoint
export async function getProductsList() {
  const { listPrintifyProducts } = await import('./printify-client.js');
  const data = await listPrintifyProducts(SHOP_ID);

  const products = (data.data || []).map(p => {
    let imageUrl = '';
    if (p.print_areas && p.print_areas[0] && p.print_areas[0].placeholders) {
      const placeholder = p.print_areas[0].placeholders.find(ph => ph.images && ph.images[0]);
      if (placeholder && placeholder.images[0]) {
        imageUrl = placeholder.images[0].src || '';
      }
    }

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

  return { products };
}

// Import products
export async function importProducts() {
  const { getProducts } = await import('./printify-client.js');
  const data = await getProducts();
  const products = data.products || [];

  const db = await (await import('../src/utils/db.js')).default;
  await saveGeneratedProducts(products, db);
  writeShopProductsJson(products);

  return { count: products.length };
}

// Main API handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, ...options } = req.body || {};

    switch (action) {
      case 'catalog':
        const catalog = await getCatalog();
        return res.status(200).json({ ok: true, ...catalog });

      case 'sync':
        const results = await fullSyncEngine(options);
        return res.status(200).json({
          ok: true,
          ...results,
          message: `Sync completed: ${results.stats.productsCreated} created, ${results.stats.errors} errors.`
        });

      case 'list':
        const products = await getProductsList();
        return res.status(200).json({ ok: true, ...products });

      case 'import':
        const imported = await importProducts();
        return res.status(200).json({ ok: true, ...imported });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error('Printify API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
