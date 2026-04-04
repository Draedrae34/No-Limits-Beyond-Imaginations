# 🚀 QUICK START - PRINTIFY SYNC

## ❌ WHY IT'S NOT WORKING

I found **3 critical issues** preventing your sync:

### 1. Wrong Environment Variable Name
Your code looks for `PRINTIFY_API_TOKEN` but your `.env.example` had `PRINTIFY_API_KEY`

### 2. Hardcoded Path
`configure-printify.py` had a hardcoded Linux path that won't work on Windows

### 3. Invalid Blueprint IDs
The blueprint IDs in your code are placeholders (0, 10, 4, etc.)

---

## ✅ WHAT I FIXED

1. ✅ Fixed `.env.example` to use `PRINTIFY_API_TOKEN`
2. ✅ Fixed `configure-printify.py` to use relative path
3. ✅ Created `test_printify_connection.py` to diagnose issues
4. ✅ Created `PRINTIFY_SYNC_TROUBLESHOOTING.md` with detailed help

---

## 🎯 DO THIS NOW (5 minutes)

### Step 1: Create Your .env File

Create a file named `.env` in your project root with:

```env
PRINTIFY_API_TOKEN=your_actual_token_here
PRINTIFY_SHOP_ID=your_actual_shop_id_here
```

**How to get these:**

1. Go to [Printify Dashboard](https://printify.com/dashboard)
2. Click **Settings** → **API**
3. Copy your **API Token**
4. Your **Shop ID** is in the URL: `https://printify.com/dashboard/shops/123456/products`
   - Shop ID = `123456`

### Step 2: Test Your Connection

Run this command:

```bash
python test_printify_connection.py
```

**Expected output:**
```
✅ CONNECTION TEST PASSED
🚀 Your Printify credentials are working!
```

**If you see errors:**
- `PRINTIFY_API_TOKEN not found` → Create .env file
- `Authentication failed` → Get new API token
- `Shop not found` → Check shop ID

### Step 3: Get Valid Blueprint IDs

**CRITICAL:** The blueprint IDs in your code are wrong!

1. Go to Printify Dashboard → **Catalog**
2. Choose a product (e.g., T-Shirts → Gildan 5000)
3. Look at the URL: `https://printify.com/dashboard/catalog/blueprints/1234`
4. Blueprint ID = `1234`

**Common blueprint IDs:**
- Gildan 5000 T-Shirt: `12`
- Bella+Canvas 3001: `6`
- Gildan 18500 Hoodie: `14`
- Mugs: `249`

**You need to:**
1. Find the exact product you want in Printify catalog
2. Note its blueprint ID
3. Update `generate-product-catalog.py` with correct IDs

### Step 4: Run the Sync

After fixing credentials and blueprint IDs:

```bash
# Generate product catalog
python generate-product-catalog.py

# Sync to Printify
python printify-sync-master.py

# Check website sync
python sync_to_website.py
```

---

## 🔍 TROUBLESHOOTING

### "PRINTIFY_API_TOKEN not found"
**Fix:** Create `.env` file with correct variable name

### "No variants for blueprint X"
**Fix:** Get valid blueprint IDs from Printify catalog

### "Image upload failed"
**Fix:** Check that images exist in `Clothing_Product/` folder

### "401 Unauthorized"
**Fix:** Generate new API token in Printify dashboard

### "404 Not Found"
**Fix:** Check shop ID in Printify dashboard URL

---

## 📚 DETAILED HELP

For comprehensive troubleshooting, see:
- `PRINTIFY_SYNC_TROUBLESHOOTING.md` - Complete troubleshooting guide
- `test_printify_connection.py` - Connection diagnostic tool

---

## ✅ VERIFICATION CHECKLIST

- [ ] `.env` file exists with `PRINTIFY_API_TOKEN`
- [ ] `.env` file exists with `PRINTIFY_SHOP_ID`
- [ ] `python test_printify_connection.py` passes
- [ ] Blueprint IDs are valid (not 0, 10, 4, etc.)
- [ ] Image files exist in `Clothing_Product/` folder
- [ ] `python generate-product-catalog.py` runs successfully
- [ ] `python printify-sync-master.py` uploads products
- [ ] Products appear in Printify dashboard
- [ ] Website displays products correctly

---

## 🆘 STILL STUCK?

1. Run the diagnostic tool:
   ```bash
   python test_printify_connection.py
   ```

2. Check the detailed guide:
   ```bash
   cat PRINTIFY_SYNC_TROUBLESHOOTING.md
   ```

3. Check sync logs:
   ```bash
   python printify-sync-master.py 2>&1 | tee sync_log.txt
   ```

---

## 🎯 SUMMARY

**The main problem:** Your `.env` file is missing or has wrong variable names.

**The fix:**
1. Create `.env` with `PRINTIFY_API_TOKEN` and `PRINTIFY_SHOP_ID`
2. Get valid blueprint IDs from Printify catalog
3. Run the sync scripts

**Your products are ready - just need the correct configuration!** 🚀
