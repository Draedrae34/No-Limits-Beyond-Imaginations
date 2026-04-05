const fs = require('fs');

// Read the products JSON
const productsData = JSON.parse(fs.readFileSync('website_products.json', 'utf8'));

// Create a JS file with the products as a variable
const jsContent = `const PRODUCTS_DATA = ${JSON.stringify(productsData)};`;

// Write to file
fs.writeFileSync('products-embedded.js', jsContent);

console.log('Created products-embedded.js with', productsData.products.length, 'products');