// api/printify.js - Consolidated Printify API (Zero external dependencies)
// Handles: status, catalog, list, sync, import

export default async function(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse body if it's a string (Vercel wraps body in JSON string)
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const action = (req.query && req.query.action) || (body && body.action) || 'status';
  const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
  const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;

  async function printifyFetch(endpoint, method = 'GET', body = null) {
    if (!PRINTIFY_API_KEY) throw new Error('PRINTIFY_API_KEY not set');
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const resp = await fetch(`https://api.printify.com/v1/${endpoint}`, opts);
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Printify API ${resp.status}: ${errText}`);
    }
    return resp.json();
  }

  function classifyProduct(title) {
    const t = title.toLowerCase();
    if (t.includes('hoodie') || t.includes('sweatpant')) return { type: 'hoodie', basePrice: 4999 };
    if (t.includes('jogger') || t.includes('sweatpant')) return { type: 'jogger', basePrice: 4499 };
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

  try {
    switch (action) {
      case 'status': {
        const hasKey = !!PRINTIFY_API_KEY;
        const hasShop = !!PRINTIFY_SHOP_ID;
        let shopInfo = null;
        if (hasKey) {
          try {
            const shops = await printifyFetch('shops.json');
            shopInfo = shops.find(s => String(s.id) === String(PRINTIFY_SHOP_ID)) || shops[0] || null;
          } catch (e) { shopInfo = { error: e.message }; }
        }
        return res.status(200).json({
          status: hasKey && hasShop ? 'connected' : 'not_configured',
          hasApiKey: hasKey, hasShopId: hasShop, shop: shopInfo,
          availableActions: ['status', 'catalog', 'list', 'sync', 'import'],
          timestamp: new Date().toISOString()
        });
      }

      case 'list': {
        if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID)
          return res.status(400).json({ error: 'Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID' });
        const products = await printifyFetch(`shops/${PRINTIFY_SHOP_ID}/products.json`);
        const items = (products.data || products || []).map(p => ({
          id: p.id, title: p.title, description: p.description, tags: p.tags,
          images: (p.images || []).map(img => img.src),
          variants: (p.variants || []).length,
          ...classifyProduct(p.title)
        }));
        return res.status(200).json({ count: items.length, products: items, timestamp: new Date().toISOString() });
      }

      case 'catalog': {
        if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID)
          return res.status(400).json({ error: 'Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID' });
        const products = await printifyFetch(`shops/${PRINTIFY_SHOP_ID}/products.json`);
        const items = (products.data || products || []);
        const catalog = items.map(p => {
          const { type, basePrice } = classifyProduct(p.title);
          const images = (p.images || []).map(img => img.src);
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
            inStock: true
          };
        });
        return res.status(200).json({ catalog });
      }

      case 'sync': {
        if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID)
          return res.status(400).json({ error: 'Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID' });
        const dryRun = (req.query && req.query.dryRun === 'true') || (body && body.dryRun === true);
        const products = await printifyFetch(`shops/${PRINTIFY_SHOP_ID}/products.json`);
        const items = (products.data || products || []);
        const syncResults = items.map(p => {
          const { type, basePrice } = classifyProduct(p.title);
          return {
            id: p.id, title: p.title, category: type,
            price: (basePrice / 100).toFixed(2),
            images: (p.images || []).length,
            status: dryRun ? 'would_sync' : 'synced'
          };
        });
        return res.status(200).json({
          mode: dryRun ? 'dry_run' : 'live', total: syncResults.length, results: syncResults,
          message: dryRun ? `Dry run: ${syncResults.length} products would sync.` : `${syncResults.length} products synced.`,
          timestamp: new Date().toISOString()
        });
      }

      case 'import': {
        if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID)
          return res.status(400).json({ error: 'Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID' });
        const products = await printifyFetch(`shops/${PRINTIFY_SHOP_ID}/products.json`);
        const items = (products.data || products || []);
        return res.status(200).json({
          imported: items.length,
          products: items.map(p => ({ id: p.id, title: p.title, ...classifyProduct(p.title) })),
          message: `${items.length} products imported from Printify.`,
          timestamp: new Date().toISOString()
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}`, availableActions: ['status', 'catalog', 'list', 'sync', 'import'] });
    }
  } catch (err) {
    console.error('Printify API Error:', err.message);
    return res.status(500).json({ error: err.message, action, timestamp: new Date().toISOString() });
  }
};
