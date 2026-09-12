

const PRINTIFY_BASE = 'https://api.printify.com/v1';
function apiKey() { return process.env.PRINTIFY_API_KEY || 'YOUR_API_KEY'; }
function shopId() { return process.env.PRINTIFY_SHOP_ID || 'YOUR_SHOP_ID'; }
function printifyHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey()}`,
  };
}
export const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || 'YOUR_API_KEY';
export const SHOP_ID = process.env.PRINTIFY_SHOP_ID || 'YOUR_SHOP_ID';

// Existing functions
export async function createProduct(productData) {
  const response = await fetch(`${PRINTIFY_BASE}/shops/${shopId()}/products.json`, {
    method: "POST",
    headers: printifyHeaders(),
    body: JSON.stringify(productData)
  });
  return response.json();
}

export async function getProducts() {
  const response = await fetch(`${PRINTIFY_BASE}/shops/${shopId()}/products.json`, {
    headers: printifyHeaders()
  });
  return response.json();
}

// NEW: Catalog functions
export async function getBlueprints() {
  const res = await fetch(`${PRINTIFY_BASE}/catalog/blueprints.json`, {
    headers: printifyHeaders()
  });
  if (!res.ok) throw new Error(`Printify blueprints error: ${res.status}`);
  return res.json();
}

export async function getPrintProviders(blueprintId) {
  const res = await fetch(
    `${PRINTIFY_BASE}/catalog/blueprints/${blueprintId}/print_providers.json`,
    { headers: printifyHeaders() }
  );
  if (!res.ok) throw new Error(`Printify providers error: ${res.status}`);
  return res.json();
}

export async function getVariants(blueprintId, providerId) {
  const res = await fetch(
    `${PRINTIFY_BASE}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
    { headers: printifyHeaders() }
  );
  if (!res.ok) throw new Error(`Printify variants error: ${res.status}`);
  return res.json();
}

// NEW: Create product with payload (matches user's signature)
export async function createPrintifyProduct(payload) {
  const res = await fetch(
    `${PRINTIFY_BASE}/shops/${shopId()}/products.json`,
    {
      method: 'POST',
      headers: printifyHeaders(),
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printify create product error: ${res.status} ${text}`);
  }
  return res.json();
}

// Upload an image (base64 contents) to the Printify media library.
// Returns { id, file_name, ... } — reference by `id` in product print areas.
export async function uploadImage(base64Contents, fileName, title) {
  const res = await fetch(`${PRINTIFY_BASE}/uploads/images.json`, {
    method: 'POST',
    headers: printifyHeaders(),
    body: JSON.stringify({ file_name: fileName, title: title || fileName, contents: base64Contents }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printify upload error: ${res.status} ${text}`);
  }
  return res.json();
}

// Publish a product so it appears in the connected storefront.
export async function publishProduct(productId) {
  const res = await fetch(`${PRINTIFY_BASE}/shops/${shopId()}/products/${productId}/publish.json`, {
    method: 'POST',
    headers: printifyHeaders(),
    body: JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, key_features: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printify publish error: ${res.status} ${text}`);
  }
  return res.json();
}
