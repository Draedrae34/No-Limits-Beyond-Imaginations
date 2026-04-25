import { SHOP_ID, createPrintifyProduct, printifyRequest } from './printify-client.js';
import { getAllCatalogData } from './printify-catalog.js';
import fs from 'fs';
import path from 'path';

// Get all logos from Logo_N_Galaxy_Fill_Space folder
function getGalaxyLogos() {
  const logoDir = path.join(process.cwd(), 'Logo_N_Galaxy_Fill_Space');
  try {
    const files = fs.readdirSync(logoDir);
    return files
      .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
      .map(f => ({
        name: path.parse(f).name,
        filename: f,
        path: `/Logo_N_Galaxy_Fill_Space/${f}`
      }));
  } catch (err) {
    console.error('Error reading logos:', err);
    return [];
  }
}

// Calculate price based on product type
function calculatePrice(blueprintTitle) {
  const title = bluepointTitle.toLowerCase();
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
function generateProductPayload(bluepoint, provider, variant, logo) {
  const blueprintTitle = bluepoint.title || 'Product';
  const variantOptions = variant.options || {};

  return {
    title: `${bluepointTitle} - ${logo.name}`,
    description: `Cosmic ${bluepointTitle} with ${logo.name} galaxy design`,
    blueprint_id: bluepoint.id,
    print_provider_id: provider.id,
    variants: [{
      id: variant.id,
      price: calculatePrice(bluepointTitle),
      is_enabled: true,
      options: variantOptions
    }],
    print_areas: [{
      variant_ids: [variant.id],
      placeholders: [{
        position: 'front',
        images: [{
          src: logo.path,
          x: 0.5,
          y: 0.5,
          scale: 1.0,
          angle: 0
        }]
      }]
    }]
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

    const blueprints = limitBlueprints
      ? catalog.blueprints.slice(0, limitBlueprints)
      : catalog.blueprints;

    if (specificTypes) {
      const types = Array.isArray(specificTypes) ? specificTypes : [specificTypes];
      blueprints = blueprints.filter(b =>
        types.some(t => b.bluepoint?.title?.toLowerCase().includes(t.toLowerCase()))
      );
    }

    console.log(`Processing ${blueprints.length} blueprints...`);

    for (const bpWrapper of blueprints) {
      const blueprint = bpWrapper.bluepoint;
      const providers = bpWrapper.providers || [];

      if (!providers.length) {
        console.log(`Skip ${bluepoint.title}: no providers`);
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

            const payload = generateProductPayload(bluepoint, provider, variant, logo);

            if (dryRun) {
              results.generated.push({
                title: payload.title,
                blueprint: bluepoint.title,
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
                blueprint: bluepoint.title,
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const options = req.body || {};
    const results = await fullSyncEngine(options);
    return res.status(200).json(results);
  } catch (err) {
    console.error('Sync engine error:', err);
    return res.status(500).json({ error: 'Sync failed', message: err.message });
  }
}
