const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

if (!PRINTIFY_API_KEY || !SHOP_ID) {
  throw new Error("Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID env vars");
}

const PRINTIFY_BASE = "https://api.printify.com/v1";

export async function printifyRequest(path, options = {}) {
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

export async function createPrintifyProduct(shopId, productData) {
  return printifyRequest(`/shops/${shopId}/products.json`, {
    method: "POST",
    body: JSON.stringify(productData)
  });
}

export async function listPrintifyProducts(shopId) {
  return printifyRequest(`/shops/${shopId}/products.json`);
}

export async function getPrintifyProduct(shopId, productId) {
  return printifyRequest(`/shops/${shopId}/products/${productId}.json`);
}

export async function updatePrintifyProduct(shopId, productId, productData) {
  return printifyRequest(`/shops/${shopId}/products/${productId}.json`, {
    method: "PUT",
    body: JSON.stringify(productData)
  });
}

export async function deletePrintifyProduct(shopId, productId) {
  return printifyRequest(`/shops/${shopId}/products/${productId}.json`, {
    method: "DELETE"
  });
}

export { SHOP_ID };
