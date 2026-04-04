# 🚀 BULK PRODUCT UPLOAD GUIDE - 1000+ Products Setup

## Current Status

✅ You have **2,013 products** in your inventory
✅ Printify integration is configured
✅ Bulk upload scripts are ready

---

## Step-by-Step Setup

### 1. **Find Your Printify Shop ID**

```bash
# Get your shop ID from Printify
# Go to: Printify Dashboard > Settings > Account
# Or run this to fetch it:
python3 - << 'EOF'
import requests
import os
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("PRINTIFY_API_TOKEN") or os.getenv("PRINTIFY_API_KEY")

headers = {"Authorization": f"Bearer {token}"}
response = requests.get("https://api.printify.com/v1/shops.json", headers=headers)

if response.status_code == 200:
    shops = response.json().get('data', [])
    for shop in shops:
        print(f"Shop ID: {shop['id']}")
        print(f"Shop Name: {shop['name']}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
EOF
```

### 2. **Update Your .env File**

Add these lines to your `.env` file:

```dotenv
# Use your API key or token - both work
PRINTIFY_API_TOKEN=your_printify_api_token_here
PRINTIFY_SHOP_ID=your_shop_id_here

# Alternative (if using API key instead of token):
# PRINTIFY_API_KEY=your_printify_api_key_here
```

### 3. **Test Credentials**

```bash
python3 bulk-upload-all-products.py
# Should print: ✅ Credentials verified!
```

### 4. **Start Bulk Upload**

**Option A: Upload All Products (Slow, Safe)**

```bash
python3 bulk-upload-all-products.py
# Uploads 2,013 products at ~5-10 per second
# Total time: ~3-5 minutes
```

**Option B: Upload First 100 (Test First)**

```bash
# Edit bulk-upload-all-products.py line ~220:
# Change: uploader.bulk_upload("all_products_inventory.json", batch_size=50)
# To: uploader.bulk_upload("all_products_inventory.json", batch_size=50)[:100]

python3 bulk-upload-all-products.py
```

### 5. **Generate Product Feed for Website**

Once upload completes:

```bash
python3 generate-product-feed.py
# Creates: product-feed.json (use on your website to display 1000+ products)
```

---

## Expected Results

### Upload Speed

- **Rate**: ~10 products/second (with rate limiting)
- **Total Time**: ~3-5 minutes for all 2,013 products
- **Cost**: FREE (Printify API has no per-product costs)

### Output Files

```
upload_log_20260304_123456.json  ← Latest upload attempt
product-feed.json                 ← Products ready for website display
```

### On Your Website

After feed generation, use this in your HTML:

```javascript
// Load product feed
fetch('/product-feed.json')
  .then((r) => r.json())
  .then((feed) => {
    console.log(`${feed.total} products loaded!`);
    // Display products...
  });
```

---

## Troubleshooting

### "Invalid Credentials"

- Check .env has correct PRINTIFY_SHOP_ID
- Run the shop ID lookup script (Step 1)
- Verify your API token has these permissions:
  - `shops.manage`, `shops.read`
  - `products.read`, `products.write`
  - `catalog.read`, `orders.read`

### "Rate Limited"

- Script has built-in delays
- If still hitting limits: increase `batch_size` in the script
- Printify allows ~10 requests/sec

### "Products Not Appearing on Website"

- Check `product-feed.json` was generated
- Ensure your shop.html loads the feed
- Verify Printify products have `status: "active"` and `visible: true`

---

## Advanced Options

### Sync Only New Products

```bash
# Only uploads products not already in Printify
# Checks existing products automatically
python3 bulk-upload-all-products.py
```

### Update Existing Products

```bash
# Coming soon: update-products.py
# Will update prices, descriptions, images for all 2000+ products
```

### Schedule Automatic Syncs

```bash
# Add to crontab to sync daily
0 2 * * * cd /home/aundrae/Silent-Spirits-Legacy && python3 bulk-upload-all-products.py
```

---

## Your 2,000+ Product Categories

Your inventory is organized into these categories:

- shirts (22)
- clothing_product_3 (100)
- long sleeves (42)
- skirts (11)
- clothing_product_5 (58)
- kids_wear (7)
- jackets (37)
- sweats (17)
- leggings (27)
- full_outfits (9)
- accessabilites (24)
- ...and 14+ more categories

**Total: 2,013 products ready to sync! 🚀**

---

## Support

Need help? Check:

1. [Printify API Docs](https://printify.com/api/)
2. Your Printify Dashboard > Settings > Webhooks
3. Verify API token has all required scopes

---

## Next Steps

1. ✅ Set up .env with PRINTIFY_SHOP_ID
2. ✅ Run `bulk-upload-all-products.py`
3. ✅ Run `generate-product-feed.py`
4. ✅ Update website to load `product-feed.json`
5. ✅ Push commits to deploy

**Your silent spirits legacy deserves to live across 2000+ unique products! 👻✨**
