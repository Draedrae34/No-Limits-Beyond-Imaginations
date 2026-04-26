// api/printify.js - Consolidated Printify API
// Replaces: catalog-endpoint.js, generate-full-catalog.js, import-products.js,
//            printify-catalog.js, printify-client.js, sync-engine.js

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || 'test_key';
const SHOP_ID = process.env.PRINTIFY_SHOP_ID || 'test_shop';
const PRINTIFY_BASE = "https://api.printify.com/v1";

// Printify API client functions
function checkCredentials() {
  if (PRINTIFY_API_KEY === 'test_key' || SHOP_ID === 'test_shop') {
    throw new Error("Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID env vars");
  }
}

async function printifyRequest(path, options = {}) {
  // Skip credential check for test mode
  if (PRINTIFY_API_KEY !== 'test_key' && SHOP_ID !== 'test_shop') {
    checkCredentials();
  }

  const url = path.startsWith('http') ? path : `${PRINTIFY_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${PRINTIFY_API_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Printify error:", res.status, text);
    throw new Error(`Printify API error: ${res.status}`);
  }

  return res.json();
}

async function createPrintifyProduct(shopId, productData) {
  return printifyRequest(`/shops/${shopId}/products.json`, {
    method: "POST",
    body: JSON.stringify(productData)
  });
}

async function listPrintifyProducts(shopId) {
  return printifyRequest(`/shops/${shopId}/products.json`);
}

// Logo loader
function loadLogos() {
  const logoDir = path.join(process.cwd(), 'Logo_N_Galaxy_Fill_Space');
  try {
    const files = fs.readdirSync(logoDir);
    return files
      .filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
      .map(file => {
        const name = path.basename(file, path.extname(file));
        const publicUrl = `${process.env.BLOB_BASE_URL || 'https://your-blob-domain/logos'}/${encodeURIComponent(file)}`;
        return {
          file,
          name,
          path: `/Logo_N_Galaxy_Fill_Space/${file}`,
          publicUrl
        };
      });
  } catch (err) {
    console.error('Error reading logos:', err);
    return [];
  }
}

// Shop JSON writer
function writeShopProductsJson(products) {
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
}

// Database functions
async function saveGeneratedProducts(products, db) {
  if (!db) {
    try {
      const dbModule = await import('../src/utils/db.js');
      db = await dbModule.default;
    } catch (err) {
      console.warn('Could not load database, skipping DB save');
      return;
    }
  }
  
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

// Catalog functions
async function getCatalog(forceRefresh = false) {
  const now = Date.now();
  const CACHE_TTL = 5 * 60 * 1000;
  
  if (getCatalog.cache && now < getCatalog.cacheExpiry && !forceRefresh) {
    return getCatalog.cache;
  }

  try {
    const [blueprints, providers] = await Promise.all([
      printifyRequest('/catalog/blueprints.json'),
      printifyRequest('/catalog/print_providers.json')
    ]);

    getCatalog.cache = {
      blueprints: blueprints.data || [],
      providers: providers.data || [],
      fetchedAt: now
    };
    getCatalog.cacheExpiry = now + CACHE_TTL;

    return getCatalog.cache;
  } catch (error) {
    console.error('Catalog fetch error:', error);
    throw error;
  }
}

async function getBlueprintDetails(blueprintId) {
  try {
    const [blueprint, providers] = await Promise.all([
      printifyRequest(`/catalog/blueprints/${blueprintId}.json`),
      printifyRequest(`/catalog/blueprints/${blueprintId}/print_providers.json`)
    ]);

    return {
      blueprint,
      providers: providers.data || []
    };
  } catch (error) {
    console.error(`Blueprint ${blueprintId} details error:`, error);
    throw error;
  }
}

async function getProviderVariants(blueprintId, providerId) {
  try {
    const res = await printifyRequest(
      `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`
    );
    return res.data || [];
  } catch (error) {
    console.error(`Provider ${providerId} variants error:`, error);
    throw error;
  }
}

async function getAllCatalogData() {
  try {
    const catalog = await getCatalog(true);
    const blueprintDetails = [];

    for (const blueprint of catalog.blueprints) {
      try {
        const details = await getBlueprintDetails(blueprint.id);
        const providersWithVariants = [];

        for (const provider of details.providers) {
          try {
            const variants = await getProviderVariants(blueprint.id, provider.id);
            providersWithVariants.push({
              ...provider,
              variants
            });
          } catch (err) {
            console.warn(`Skip provider ${provider.id}:`, err.message);
          }
        }

        blueprintDetails.push({
          blueprint,
          providers: providersWithVariants
        });
      } catch (err) {
        console.warn(`Skip blueprint ${blueprint.id}:`, err.message);
      }
    }

    return {
      blueprints: blueprintDetails,
      allProviders: catalog.providers,
      fetchedAt: Date.now()
    };
  } catch (error) {
    console.error('Full catalog fetch error:', error);
    throw error;
  }
}

// Product generation
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
  return 4500;
}

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
    console.log('Loading full Printify catalog...');
    const catalog = await getAllCatalogData();
    results.catalog.blueprints = catalog.blueprints.length;
    results.catalog.providers = catalog.allProviders.length;

    console.log(`Got ${catalog.blueprints.length} blueprints, ${catalog.allProviders.length} providers`);

    const logos = loadLogos();
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
  const catalog = await getCatalog();

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
  const data = await listPrintifyProducts(SHOP_ID);
  const products = data.products || [];

  await saveGeneratedProducts(products);
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
