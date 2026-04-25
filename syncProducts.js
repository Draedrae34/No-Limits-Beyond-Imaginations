const { PRINTIFY_API_KEY, SHOP_ID, createProduct } = require('./utils/printify.js');
const products = require('./utils/products.json');

async function syncProducts() {
  console.log('Starting product sync to Printify...');

  for (const product of products) {
    try {
      console.log(`Creating product: ${product.title}`);
      const result = await createProduct(product);
      console.log(`Created: ${result.id}`);
    } catch (error) {
      console.error(`Error creating ${product.title}:`, error.message);
    }
  }

  console.log('Sync complete!');
}

syncProducts();
