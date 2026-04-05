# 🔧 PRINTIFY SYNC TROUBLESHOOTING GUIDE

## 🚨 CRITICAL ISSUES FOUND

### Issue 1: Environment Variable Name Mismatch
**Problem:** Your code uses `PRINTIFY_API_TOKEN` but `.env.example` defines `PRINTIFY_API_KEY`

**Files Affected:**
- `printify-sync-master.py` (line 17)
- `sync_to_website.py` (line 15)
- `printify_client.py` (line 13)

**Fix:** Your `.env` file must use `PRINTIFY_API_TOKEN` (not `PRINTIFY_API_KEY`)

### Issue 2: Hardcoded Path in configure-printify.py
**Problem:** Line 42 has hardcoded Linux path `/home/aundrae/Silent-Spirits-Legacy/.env`

**Fix:** Use relative path instead

### Issue 3: Invalid Blueprint IDs
**Problem:** `generate-product-catalog.py` uses placeholder blueprint IDs (0, 10, 4, etc.)

**Fix:** You need to get actual blueprint IDs from Printify

---

## 📋 STEP-BY-STEP FIX

### Step 1: Create/Update Your .env File

Create a `.env` file in your project root with:

```env
# Printify Configuration
PRINTIFY_API_TOKEN=your_actual_printify_api_token_here
PRINTIFY_SHOP_ID=your_actual_shop_id_here

# Stripe (if needed)
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
```

**How to get your Printify credentials:**

1. Go to [Printify Dashboard](https://printify.com/dashboard)
2. Click **Settings** → **API**
3. Copy your **API Token**
4. Your **Shop ID** is in the URL when viewing your shop:
   - Example: `https://printify.com/dashboard/shops/123456/products`
   - Shop ID = `123456`

### Step 2: Verify Your .env File

Run this command to check if your credentials are loaded:

```bash
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('Token:', 'SET' if os.getenv('PRINTIFY_API_TOKEN') else 'MISSING'); print('Shop ID:', 'SET' if os.getenv('PRINTIFY_SHOP_ID') else 'MISSING')"
```

### Step 3: Test Printify Connection

Run this test script:

```bash
python test_printify_connection.py
```

### Step 4: Get Valid Blueprint IDs

**CRITICAL:** The blueprint IDs in `generate-product-catalog.py` are placeholders!

**How to get real blueprint IDs:**

1. Go to Printify Dashboard
2. Click **Catalog**
3. Choose a product category (e.g., T-Shirts)
4. Select a specific product (e.g., Gildan 5000)
5. The blueprint ID is in the URL:
   - Example: `https://printify.com/dashboard/catalog/blueprints/1234`
   - Blueprint ID = `1234`

**Common Printify Blueprint IDs:**
- T-Shirts: Varies by brand (Gildan 5000 = 12, Bella+Canvas 3001 = 6)
- Hoodies: Varies by brand (Gildan 18500 = 14)
- Jackets: Varies by style
- Mugs: 249

**You need to:**
1. Go to Printify Catalog
2. Find the exact product you want
3. Note its blueprint ID
4. Update `generate-product-catalog.py` with correct IDs

### Step 5: Run the Sync

After fixing credentials and blueprint IDs:

```bash
# 1. Generate product catalog
python generate-product-catalog.py

# 2. Sync to Printify
python printify-sync-master.py

# 3. Check website sync
python sync_to_website.py
```

---

## 🔍 COMMON ERROR MESSAGES & FIXES

### "PRINTIFY_API_TOKEN not found in .env"
**Cause:** Missing or incorrectly named environment variable

**Fix:**
1. Create `.env` file in project root
2. Add: `PRINTIFY_API_TOKEN=your_token_here`
3. Make sure variable name is exactly `PRINTIFY_API_TOKEN` (not `PRINTIFY_API_KEY`)

### "No variants for blueprint X"
**Cause:** Invalid blueprint ID

**Fix:**
1. Go to Printify Catalog
2. Find the product you want
3. Get the correct blueprint ID from the URL
4. Update `generate-product-catalog.py`

### "Image upload failed"
**Cause:** Image file not found or path incorrect

**Fix:**
1. Check that image files exist in `Clothing_Product/` folder
2. Verify image paths in `all_products_inventory.json`
3. Ensure images are valid PNG/JPG files

### "401 Unauthorized"
**Cause:** Invalid API token

**Fix:**
1. Go to Printify Dashboard → Settings → API
2. Generate a new API token
3. Update `.env` file with new token

### "404 Not Found"
**Cause:** Invalid shop ID

**Fix:**
1. Check your Printify dashboard URL
2. Copy the shop ID from the URL
3. Update `.env` file

---

## 🛠️ DEBUGGING SCRIPTS

### Test Printify Connection
```python
# test_printify_connection.py
import os
from dotenv import load_dotenv
import requests

load_dotenv()

token = os.getenv("PRINTIFY_API_TOKEN")
shop_id = os.getenv("PRINTIFY_SHOP_ID")

print(f"Token: {'SET' if token else 'MISSING'}")
print(f"Shop ID: {'SET' if shop_id else 'MISSING'}")

if token and shop_id:
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"https://api.printify.com/v1/shops/{shop_id}/products.json",
        headers=headers
    )
    print(f"API Response: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Products in shop: {len(data.get('data', []))}")
    else:
        print(f"Error: {response.text}")
```

### Check Product Catalog
```bash
python -c "import json; data = json.load(open('products_catalog.json')); print(f'Total products: {len(data[\"products\"])}'); print('Sample:', data['products'][0] if data['products'] else 'No products')"
```

---

## 📊 EXPECTED WORKFLOW

```
1. Create .env with correct credentials
           ↓
2. Get valid blueprint IDs from Printify
           ↓
3. Update generate-product-catalog.py with blueprint IDs
           ↓
4. Run generate-product-catalog.py
           ↓
5. Run printify-sync-master.py
           ↓
6. Check Printify dashboard for products
           ↓
7. Run sync_to_website.py
           ↓
8. Test website shop page
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] `.env` file exists with `PRINTIFY_API_TOKEN`
- [ ] `.env` file exists with `PRINTIFY_SHOP_ID`
- [ ] API token is valid (test with connection script)
- [ ] Shop ID is correct
- [ ] Blueprint IDs are valid (not 0, 10, 4, etc.)
- [ ] Image files exist in `Clothing_Product/` folder
- [ ] `products_catalog.json` is generated
- [ ] Products appear in Printify dashboard
- [ ] Website displays products correctly

---

## 🆘 STILL NOT WORKING?

1. **Check Printify account status** - Is your account active?
2. **Check API limits** - Printify has rate limits
3. **Check product count** - Do you have too many products?
4. **Check image sizes** - Are images too large?
5. **Check network** - Can you access Printify website?

**Run this for detailed error info:**
```bash
python printify-sync-master.py 2>&1 | tee sync_log.txt
```

Then check `sync_log.txt` for specific error messages.

---

## 📞 SUPPORT RESOURCES

- Printify API Docs: https://developers.printify.com/
- Printify Support: https://printify.com/help
- Your project files:
  - `printify-sync-master.py` - Main sync script
  - `generate-product-catalog.py` - Product catalog generator
  - `sync_to_website.py` - Website sync checker
  - `printify_client.py` - Printify API client

---

## 🎯 QUICK FIX SUMMARY

1. **Create `.env` file** with correct variable names
2. **Get valid blueprint IDs** from Printify catalog
3. **Update `generate-product-catalog.py`** with real blueprint IDs
4. **Run the sync scripts** in order
5. **Verify in Printify dashboard**

Your products are ready - just need the correct configuration! 🚀
