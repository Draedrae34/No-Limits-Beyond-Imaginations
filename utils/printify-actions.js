// utils/printify-actions.js - shared Printify action helper for serverless modules.

const PRINTIFY_BASE = 'https://api.printify.com/v1';

function getPrintifyConfig() {
  return {
    apiKey: process.env.PRINTIFY_API_KEY,
    shopId: process.env.PRINTIFY_SHOP_ID,
  };
}

async function printifyFetch(endpoint, method = 'GET', body = null) {
  const { apiKey } = getPrintifyConfig();
  if (!apiKey) throw new Error('PRINTIFY_API_KEY not set');

  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(`${PRINTIFY_BASE}/${endpoint}`, opts);
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Printify API ${resp.status}: ${errText}`);
  }
  return resp.json();
}

function classifyProduct(title = '') {
  const t = title.toLowerCase();
  if (t.includes('hoodie') || t.includes('sweatpant')) return { type: 'hoodie', basePrice: 4999 };
  if (t.includes('jogger') || t.includes('pants')) return { type: 'jogger', basePrice: 4499 };
  if (t.includes('jacket') || t.includes('windbreaker')) return { type: 'jacket', basePrice: 5499 };
  if (t.includes('tank')) return { type: 'tank', basePrice: 2999 };
  if (t.includes('crop')) return { type: 'crop-top', basePrice: 3299 };
  if (t.includes('dress')) return { type: 'dress', basePrice: 4499 };
  if (t.includes('skirt')) return { type: 'skirt', basePrice: 3999 };
  if (t.includes('hat') || t.includes('cap') || t.includes('beanie')) return { type: 'hat', basePrice: 2499 };
  if (t.includes('bag') || t.includes('tote') || t.includes('backpack')) return { type: 'bag', basePrice: 2999 };
  if (t.includes('mug') || t.includes('cup')) return { type: 'mug', basePrice: 1999 };
  if (t.includes('poster') || t.includes('print') || t.includes('canvas')) return { type: 'wall-art', basePrice: 2999 };
  if (t.includes('sticker')) return { type: 'sticker', basePrice: 499 };
  if (t.includes('phone') || t.includes('case')) return { type: 'phone-case', basePrice: 1999 };
  return { type: 'tee', basePrice: 3499 };
}

export default async function printify(action = 'status', options = {}) {
  const { apiKey, shopId } = getPrintifyConfig();

  switch (action) {
    case 'status': {
      let shop = null;
      if (apiKey) {
        try {
          const shops = await printifyFetch('shops.json');
          shop = shops.find((s) => String(s.id) === String(shopId)) || shops[0] || null;
        } catch (err) {
          shop = { error: err.message };
        }
      }
      return {
        status: apiKey && shopId ? 'connected' : 'not_configured',
        hasApiKey: !!apiKey,
        hasShopId: !!shopId,
        shop,
        timestamp: new Date().toISOString(),
      };
    }

    case 'blueprints':
      return printifyFetch('catalog/blueprints.json');

    case 'blueprint-details':
      return printifyFetch(`catalog/blueprints/${options.blueprintId}/print_providers.json`);

    case 'variants':
      return printifyFetch(
        `catalog/blueprints/${options.blueprintId}/print_providers/${options.providerId}/variants.json`
      );

    case 'create':
      if (!shopId) throw new Error('PRINTIFY_SHOP_ID not set');
      return printifyFetch(`shops/${shopId}/products.json`, 'POST', options.productData);

    case 'list':
    case 'adminList': {
      if (!shopId) throw new Error('PRINTIFY_SHOP_ID not set');
      return printifyFetch(`shops/${shopId}/products.json`);
    }

    case 'catalog': {
      if (!shopId) throw new Error('PRINTIFY_SHOP_ID not set');
      const products = await printifyFetch(`shops/${shopId}/products.json`);
      const items = products.data || products || [];
      const catalog = items.map((p) => {
        const { type, basePrice } = classifyProduct(p.title);
        const images = (p.images || []).map((img) => img.src);
        return {
          id: p.id,
          title: p.title,
          description: p.description || '',
          category: type,
          price: (basePrice / 100).toFixed(2),
          priceCents: basePrice,
          image: images[0] || null,
          images,
          tags: p.tags || [],
          inStock: true,
        };
      });
      return { catalog };
    }

    case 'sync':
    case 'import': {
      if (!shopId) throw new Error('PRINTIFY_SHOP_ID not set');
      const products = await printifyFetch(`shops/${shopId}/products.json`);
      const items = products.data || products || [];
      return {
        imported: items.length,
        total: items.length,
        results: items.map((p) => ({ id: p.id, title: p.title, ...classifyProduct(p.title) })),
      };
    }

    default:
      throw new Error(`Unknown Printify action: ${action}`);
  }
}
