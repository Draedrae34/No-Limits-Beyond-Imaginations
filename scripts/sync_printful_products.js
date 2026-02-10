#!/usr/bin/env node
/**
 * Sync products from Printful to data/products.json
 * Run this script to automatically pull your Printful catalog
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY || '';
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID || '';
const OUTPUT_FILE = path.join(__dirname, '../data/products.json');

function printfulRequest(endpoint) {
  return new Promise((resolve, reject) => {
    if (!PRINTFUL_API_KEY) {
      return reject(new Error('PRINTFUL_API_KEY environment variable not set'));
    }

    const headers = {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json'
    };

    // Add store ID header if provided
    if (PRINTFUL_STORE_ID) {
      headers['X-PF-Store-Id'] = PRINTFUL_STORE_ID;
    }

    const options = {
      hostname: 'api.printful.com',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `Printful API error: ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function syncProducts() {
  console.log('🔄 Syncing products from Printful...');

  try {
    // Fetch store products
    const response = await printfulRequest('/store/products');
    const storeProducts = response.result || [];

    console.log(`📦 Found ${storeProducts.length} products in your Printful store`);

    // Transform to our format
    const products = [];
    
    for (const product of storeProducts) {
      // Fetch detailed product info with variants
      const detailResponse = await printfulRequest(`/store/products/${product.id}`);
      const detail = detailResponse.result;
      
      if (!detail || !detail.sync_product || !detail.sync_variants) {
        console.log(`⚠️  Skipping product ${product.id} - missing data`);
        continue;
      }

      const syncProduct = detail.sync_product;
      const variants = detail.sync_variants;

      // Get the first variant for default pricing/image
      const defaultVariant = variants[0];
      
      products.push({
        id: syncProduct.id,
        name: syncProduct.name,
        price: parseFloat(defaultVariant?.retail_price || 29.99),
        category: getCategoryFromProduct(syncProduct),
        emoji: getEmojiFromProduct(syncProduct),
        desc: syncProduct.name,
        image: syncProduct.thumbnail_url || defaultVariant?.files?.[0]?.preview_url || '',
        printfulVariantId: defaultVariant?.id,
        printfulProductId: syncProduct.id,
        variants: variants.map(v => ({
          id: v.id,
          name: v.name,
          size: v.size || 'One Size',
          color: v.color || '',
          price: parseFloat(v.retail_price || 29.99),
          available: v.is_ignored ? false : true
        })),
        sizes: [...new Set(variants.map(v => v.size).filter(Boolean))],
        colors: [...new Set(variants.map(v => v.color).filter(Boolean))]
      });
    }

    // Save to products.json
    const output = { items: products };
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

    console.log(`✅ Successfully synced ${products.length} products to ${OUTPUT_FILE}`);
    console.log('\nProducts:');
    products.forEach(p => {
      console.log(`  - ${p.name} ($${p.price}) - ${p.variants.length} variants`);
    });

  } catch (error) {
    console.error('❌ Error syncing products:', error.message);
    process.exit(1);
  }
}

function getCategoryFromProduct(product) {
  const name = product.name.toLowerCase();
  if (name.includes('hoodie') || name.includes('sweatshirt')) return 'hoodies';
  if (name.includes('t-shirt') || name.includes('tee')) return 't-shirts';
  if (name.includes('hat') || name.includes('cap') || name.includes('beanie')) return 'accessories';
  if (name.includes('bag') || name.includes('tote')) return 'accessories';
  if (name.includes('poster') || name.includes('print')) return 'digital';
  return 'apparel';
}

function getEmojiFromProduct(product) {
  const name = product.name.toLowerCase();
  if (name.includes('hoodie') || name.includes('sweatshirt')) return '🧥';
  if (name.includes('t-shirt') || name.includes('tee')) return '👕';
  if (name.includes('hat') || name.includes('cap')) return '🧢';
  if (name.includes('beanie')) return '🎩';
  if (name.includes('bag') || name.includes('tote')) return '👜';
  if (name.includes('poster') || name.includes('print')) return '🖼️';
  return '👔';
}

// Run the sync
syncProducts();
