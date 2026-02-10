#!/usr/bin/env node
/**
 * Generate products from clothing design images
 * Automatically creates product entries with names, prices, sizes, and variant IDs
 */

const fs = require('fs').promises;
const path = require('path');

const CLOTHING_DIR = path.join(__dirname, '../Clothing_Product');
const OUTPUT_FILE = path.join(__dirname, '../data/products.json');

// Product configuration
const PRODUCT_CONFIG = {
  basePrice: 49.99,
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  categories: {
    'Clothing_Product_4': 'hoodies',
    'Clothing_Product_5': 't-shirts', 
    'Clothing_Product_6': 'jackets',
    'Clothing_product_3': 'joggers',
    'clothing_poduct': 'accessories',
    'clothing_product_2': 'tank-tops',
    'Mix1': 'limited-edition',
    'Mix2': 'exclusive-collection'
  },
  emojis: {
    'hoodies': '🧥',
    't-shirts': '👕',
    'jackets': '🧥',
    'joggers': '👖',
    'accessories': '🎩',
    'tank-tops': '👕',
    'limited-edition': '⭐',
    'exclusive-collection': '💎'
  },
  pricing: {
    'hoodies': 59.99,
    't-shirts': 29.99,
    'jackets': 79.99,
    'joggers': 49.99,
    'accessories': 24.99,
    'tank-tops': 24.99,
    'limited-edition': 89.99,
    'exclusive-collection': 124.99
  }
};

function generateProductName(filename, category) {
  // Remove file extension and UUID
  const name = filename.replace(/\.(png|jpg|jpeg)$/i, '').replace(/^[a-f0-9-]+-?/, '');
  
  // Convert to title case
  const titleCase = name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
  
  // Add category prefix
  const categoryNames = {
    'hoodies': 'Cosmic Hoodie',
    't-shirts': 'Legacy Tee',
    'jackets': 'Quantum Jacket',
    'joggers': 'Infinity Joggers',
    'accessories': 'Nova Cap',
    'tank-tops': 'Stellar Tank',
    'limited-edition': 'Limited Edition',
    'exclusive-collection': 'Exclusive Collection'
  };
  
  return titleCase || `${categoryNames[category] || 'No Limits Design'}`;
}

function generateVariantId(productId, size, colorIndex = 0) {
  // Generate mock Printful variant IDs (you'll replace these with real ones)
  const baseId = 4000 + (productId * 100) + (size.charCodeAt(0) * 10) + colorIndex;
  return baseId;
}

async function generateProducts() {
  console.log('🎨 Generating products from clothing designs...');
  
  try {
    const products = [];
    let productId = 1;
    
    // Read all clothing product directories
    const directories = await fs.readdir(CLOTHING_DIR);
    
    for (const dir of directories) {
      const dirPath = path.join(CLOTHING_DIR, dir);
      const stat = await fs.stat(dirPath);
      
      if (!stat.isDirectory()) continue;
      
      // Get category for this directory
      const category = PRODUCT_CONFIG.categories[dir] || 'apparel';
      const emoji = PRODUCT_CONFIG.emojis[category] || '👔';
      const price = PRODUCT_CONFIG.pricing[category] || PRODUCT_CONFIG.basePrice;
      
      // Read all image files in this directory
      const files = await fs.readdir(dirPath);
      const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));
      
      console.log(`📁 ${dir}: ${imageFiles.length} designs`);
      
      for (const file of imageFiles) {
        const imagePath = path.join(dirPath, file);
        const productName = generateProductName(file, category);
        
        // Create variants for all sizes
        const variants = PRODUCT_CONFIG.sizes.map((size, index) => ({
          id: generateVariantId(productId, size, index),
          name: `${productName} - ${size}`,
          size: size,
          color: 'Default',
          price: price,
          available: true,
          printfulVariantId: generateVariantId(productId, size, index)
        }));
        
        // Create product entry
        const product = {
          id: productId,
          name: productName,
          price: price,
          category: category,
          emoji: emoji,
          desc: `Premium ${category.replace('-', ' ')} with custom design. Part of the No Limits Beyond Limitations collection.`,
          image: `Clothing_Product/${dir}/${file}`,
          printfulVariantId: variants[0].printfulVariantId,
          printfulProductId: productId + 1000, // Mock product ID
          variants: variants,
          sizes: PRODUCT_CONFIG.sizes,
          colors: ['Default'],
          folder: dir,
          filename: file
        };
        
        products.push(product);
        productId++;
        
        console.log(`  ✅ ${productName} - $${price} - ${variants.length} sizes`);
      }
    }
    
    // Save to products.json
    const output = { items: products };
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
    
    console.log(`\n🎉 Generated ${products.length} products!`);
    console.log(`📄 Saved to: ${OUTPUT_FILE}`);
    console.log('\n📊 Summary:');
    
    // Summary by category
    const summary = {};
    products.forEach(p => {
      summary[p.category] = (summary[p.category] || 0) + 1;
    });
    
    Object.entries(summary).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} products`);
    });
    
    console.log('\n⚠️  Note: Printful variant IDs are mock values.');
    console.log('   Replace them with real Printful variant IDs after uploading designs.');
    
  } catch (error) {
    console.error('❌ Error generating products:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateProducts();
