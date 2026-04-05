const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadShopFiles() {
  const files = [
    'final_official_shop.html',
    'vercel.json',
    'success.html',
    'website_products.json',
    'api/stripe-payment.js',
    'api/create-printify-order.js',
    'js/stripe-payment.js'
  ];

  console.log('Uploading shop files to Vercel Blob...');

  for (const file of files) {
    try {
      const filePath = path.join(__dirname, file);
      const fileContent = fs.readFileSync(filePath);
      
      const blob = await put(file.replace(/\//g, '-'), fileContent, {
        access: 'public',
      });

      console.log(`✓ Uploaded ${file} to ${blob.url}`);
    } catch (error) {
      console.error(`✗ Failed to upload ${file}:`, error.message);
    }
  }

  console.log('\nAll files uploaded! Access your shop at:');
  console.log('https://your-blob-url.public.blob.vercel-storage.com/final_official_shop.html');
}

uploadShopFiles();