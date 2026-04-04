# 🎨 PRINTIFY SETUP GUIDE - YOUR ACTUAL CLOTHING DESIGNS

## 📋 WHAT YOU NEED TO DO

### 1. 🔑 GET PRINTIFY API CREDENTIALS

1. Go to [Printify Dashboard](https://printify.com/dashboard)
2. Click **Settings** → **API**
3. Copy your **API Token**
4. Copy your **Shop ID** (from URL or settings)

### 2. ⚙️ CONFIGURE NETLIFY ENVIRONMENT VARIABLES

In your Netlify dashboard, go to **Site settings** → **Environment variables** and add:

```
PRINTIFY_API_TOKEN=your_printify_api_token_here
PRINTIFY_SHOP_ID=your_shop_id_here
```

### 3. 🎨 UPLOAD YOUR DESIGNS TO PRINTIFY

#### FOR EACH OF YOUR CLOTHING DESIGNS:

**T-SHIRTS:**
- Go to Printify Catalog → T-Shirts
- Choose a base product (e.g., Gildan 5000)
- Upload your design images:
  - `Black Tee Front Logo.png` → Front print area
  - Set print size and position
- Save as product and note the Blueprint ID

**HOODIES:**
- Go to Printify Catalog → Hoodies
- Choose a base product (e.g., Gildan 18500)
- Upload your galaxy designs:
  - `Purple Galaxy Hoodie.png` → Front/back
  - `galaxy_pattern.png` → All-over print if available
- Save and note Blueprint ID

**JACKETS:**
- Go to Printify Catalog → Jackets
- Choose appropriate base products
- Upload your designs:
  - `Gold Varsity Jacket.png`
  - `Cyan Denim Jacket.png`
  - `Neon Green Bomber Jacket.png`
- Save and note Blueprint IDs

**PANTS & HEADWEAR:**
- Follow same process for joggers, shorts, beanies, hats
- Upload your design files
- Save and note Blueprint IDs

### 4. 🔗 UPDATE PRODUCT MAPPINGS

Edit `/netlify/functions/create-printify-order.js` and update the `printifyProductMap` with your actual Printify Blueprint IDs:

```javascript
const printifyProductMap = {
  1001: { blueprint_id: "YOUR_ACTUAL_BLUEPRINT_ID", variant_id: 1 }, // Black Tee Front Logo
  1007: { blueprint_id: "YOUR_HOODIE_BLUEPRINT_ID", variant_id: 1 }, // Purple Galaxy Hoodie
  // ... update all your products
};
```

### 5. 🚀 TEST THE INTEGRATION

1. Deploy your Netlify functions
2. Test ordering a product from your shop
3. Check if order appears in Printify dashboard
4. Verify production status

## 🎯 YOUR DESIGNS THAT NEED PRINTIFY PRODUCTS

### T-SHIRTS (6 designs):
- ✅ Black Tee Front Logo.png
- ✅ Navy Polo Shirt.png  
- ✅ Lavender Long Sleeve.png
- ✅ White Crewneck Sweatshirt.png
- ✅ Blue Tie-Dye Tank Top.png
- ✅ Pink Crop Hoodie.png

### GALAXY HOODIES (3 designs):
- ✅ Purple Galaxy Hoodie.png
- ✅ galaxy_pattern.png (all-over print)
- ✅ logo_main.png (logo placement)

### JACKETS (4 designs):
- ✅ Cyan Denim Jacket.png
- ✅ Gold Varsity Jacket.png
- ✅ Neon Green Bomber Jacket.png
- ✅ Orange Windbreaker.png

### PANTS (3 designs):
- ✅ Coral Shorts.png
- ✅ Red Galaxy Joggers.png
- ✅ Silver Track Pants.png

### HEADWEAR (2 designs):
- ✅ Mint Green Beanie.png
- ✅ Yellow Snapback Hat.png

## 🔧 AUTOMATION SCRIPTS

You have these scripts ready to help:

- `configure-printify.py` - Safely configure your API token
- `scripts/publish_to_printify.js` - Bulk upload products
- `api/sync-printify-products.py` - Sync your catalog

## 📞 SUPPORT

- Printify API docs: https://developers.printify.com/
- Your designs are ready - just need to map to Printify products
- Each design needs a Printify blueprint ID for production

## ⚡ QUICK START

1. Run: `python configure-printify.py`
2. Upload designs to Printify manually
3. Update blueprint IDs in create-printify-order.js
4. Set Netlify environment variables
5. Test an order

Your clothing designs are AMAZING and ready for production! 🚀
