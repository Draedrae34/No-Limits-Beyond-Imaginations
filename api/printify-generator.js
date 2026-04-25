import { printifyRequest, SHOP_ID } from './printify-client.js';
import { getCatalog, getAllCatalogData } from './printify-catalog.js';
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
        path: `/Logo_N_Galaxy_Fill_Space/${f}`,
        filename: f
      }));
  } catch (err) {
    console.error('Error reading logos:', err);
    return [];
  }
}

// Generate all product combinations
export async function generateAllProducts(options = {}) {
  const {
    dryRun = false,      // Don't actually create in Printify
    limitBlueprints,   // Limit number of blueprints (for testing)
    limitLogos,        // Limit number of logos (for testing)
    specificTypes     // Array of product types to generate (e.g., ['Hoodies', 'T-Shirts'])
  } = options;

  try {
    console.log('Loading full catalog from Printify...');
    const catalog = await getAllCatalogData();

    console.log(`Got ${catalog.blueprints.length} blueprints, ${catalog.allProviders.length} providers`);

    const logos = getGalaxyLogos();
    console.log(`Got ${logos.length} galaxy logos`);

    if (limitLogos) logos.splice(limitLogos);

    const blueprints = limitBlueprints
      ? catalog.blueprints.slice(0, limitBlueprints)
      : catalog.blueprints;

    const generatedProducts = [];
    let totalCombinations = 0;
    const errors = [];

    for (const blueprint of blueprints) {
      const blueprintInfo = catalog.blueprints.find(b => b.id === blueprint.id);
      if (!blueprintInfo) continue;

      // Skip if specific types specified and this isn't one of them
      if (specificTypes && !specificTypes.some(t =>
        blueprintInfo.title?.toLowerCase().includes(t.toLowerCase())
      )) {
        continue;
      }

      const providers = blueprintInfo.providers || [];
      const variants = blueprintInfo.variants || [];

      for (const logo of logos) {
        for (const provider of providers) {
          const providerVariants = provider.variants || variants;

          for (const variant of providerVariants) {
            totalCombinations++;

            const productData = {
              title: `${blueprintInfo.title} - ${logo.name}`,
              description: `Galaxy ${blueprintInfo.title} with ${logo.name} design`,
              blueprint_id: blueprint.id,
              print_provider_id: provider.id,
              variants: [{
                id: variant.id,
                price: calculatePrice(blueprintInfo.title, provider.id) * 100,
                is_enabled: true,
                options: variant.options || {}
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

            if (!dryRun) {
              try {
                const created = await printifyRequest(
                  `/shops/${SHOP_ID}/products.json`,
                  {
                    method: 'POST',
                    body: JSON.stringify(productData)
                  }
                );

                generatedProducts.push({
                  title: productData.title,
                  id: created.id,
                  blueprint: blueprintInfo.title,
                  logo: logo.name,
                  provider: provider.id
                });
              } catch (err) {
                errors.push({
                  title: productData.title,
                  error: err.message
                });
              }
            } else {
              generatedProducts.push({
                title: productData.title,
                blueprint: blueprintInfo.title,
                logo: logo.name,
                provider: provider.id,
                dryRun: true
              });
            }
          }
        }
      }
    }

    return {
      totalCombinations,
      generated: generatedProducts.length,
      products: generatedProducts,
      errors,
      message: dryRun ? 'Dry run completed' : 'Products generated'
    };
  } catch (error) {
    console.error('Generation error:', error);
    throw error;
  }
}

function calculatePrice(blueprintTitle, providerId) {
  const title = blueprintTitle.toLowerCase();
  if (title.includes('hoodie')) return 65.00;
  if (title.includes('t-shirt') || title.includes('tee')) return 35.00;
  if (title.includes('jogger')) return 55.00;
  if (title.includes('phone case')) return 29.99;
  if (title.includes('poster')) return 24.99;
  if (title.includes('sticker')) return 17.99;
  if (title.includes('hat')) return 34.99;
  if (title.includes('tumbler')) return 39.99;
  if (title.includes('backpack')) return 69.99;
  return 45.00; // default
}

// API handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const options = req.body || {};
    const result = await generateAllProducts(options);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Generator error:', err);
    return res.status(500).json({ error: 'Generation failed' });
  }
}
