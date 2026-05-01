export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  // Auth check
  const cookies = req.headers.cookie || "";
  const isAuth = cookies.split(';').some(c => c.trim() === 'nlbl_auth=authenticated');
  if (!isAuth) return res.status(401).json({ error: 'Authentication required' });

  var apiKey = process.env.PRINTIFY_API_KEY;
  var shopId = process.env.PRINTIFY_SHOP_ID;

  if (!apiKey || !shopId) {
    return res.status(500).json({
      success: false,
      error: "Printify not configured. Set PRINTIFY_API_KEY and PRINTIFY_SHOP_ID in Vercel env vars."
    });
  }

  try {
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 20;
    var url = "https://api.printify.com/v1/shops/" + shopId + "/products.json?page=" + page + "&limit=" + limit;

    var response = await fetch(url, {
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      var errText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: "Printify API error: " + response.status,
        details: errText
      });
    }

    var data = await response.json();
    var products = (data.data || []).map(function(p) {
      return {
        id: p.id,
        title: p.title,
        description: p.description || "",
        tags: p.tags || [],
        images: (p.images || []).map(function(img) {
          return { src: img.src, is_default: img.is_default };
        }),
        variants: (p.variants || []).map(function(v) {
          return { id: v.id, title: v.title, price: v.price, is_enabled: v.is_enabled };
        }),
        created_at: p.created_at,
        visible: p.visible,
        is_locked: p.is_locked
      };
    });

    return res.status(200).json({
      success: true,
      products: products,
      total: data.total || products.length,
      page: page,
      limit: limit
    });
  } catch (err) {
    console.error("[products-list] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch products: " + err.message
    });
  }
}
