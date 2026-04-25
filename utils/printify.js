import fetch from 'node-fetch';

export const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY || "YOUR_API_KEY";
export const SHOP_ID = process.env.PRINTIFY_SHOP_ID || "YOUR_SHOP_ID";

const PRINTIFY_BASE = 'https://api.printify.com/v1';

function printifyHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
  };
}

// Existing functions
export async function createProduct(productData) {
  const response = await fetch(`${PRINTIFY_BASE}/shops/${SHOP_ID}/products.json`, {
    method: "POST",
    headers: printifyHeaders(),
    body: JSON.stringify(productData)
  });
  return response.json();
}

export async function getProducts() {
  const response = await fetch(`${PRINTIFY_BASE}/shops/${SHOP_ID}/products.json`, {
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
    `${PRINTIFY_BASE}/shops/${SHOP_ID}/products.json`,
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
