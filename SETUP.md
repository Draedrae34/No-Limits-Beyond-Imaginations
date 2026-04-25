# Silent Spirits Legacy - Setup Guide

## Quick Start

### 1. Import Products to Database
After deployment, make a POST request to:
```
POST /api/import-products
```
This imports all 15 products from `shop-products.json` into your Neon database.

### 2. Set Up Printify
1. Go to [Printify API settings](https://printify.com/app/settings/api)
2. Copy your API key
3. Update `utils/printify.js`:
   - Replace `YOUR_API_KEY` with your actual API key
   - Replace `YOUR_SHOP_ID` with your shop ID

### 3. Set Up Live PayPal
1. Get your live PayPal client ID from [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Update `shop.html` line 709:
   - Replace `YOUR_LIVE_CLIENT_ID` with your actual client ID
3. Update product prices in the PayPal buttons (search for `PRICE_HERE` and `PRODUCT_NAME_HERE`)

### 4. Final Checks
- [ ] Visit `/api/import-products` (POST) to import products
- [ ] Check `/api/products` returns all products
- [ ] Test PayPal checkout with a real transaction
- [ ] Verify all images load correctly
- [ ] Test mobile layout
- [ ] Check all navigation links work

### 5. Launch
1. Commit any final changes
2. Push to main
3. Vercel auto-deploys
4. Share your live site!

## Product Lineup (15 Products)
1. Galaxy Hoodie - No Limits Logo ($49.99)
2. Galaxy Hoodie - No Limits Logo 2 ($49.99)
3. Galaxy T-Shirt - Memorial Enhanced ($29.99)
4. Galaxy T-Shirt - NLBLITMWI Stained Glass ($29.99)
5. Galaxy Joggers - Gold Luxury ($44.99)
6. Phone Case - Supernova Explosion ($24.99)
7. Poster - Cosmic Storm ($19.99)
8. Sticker Pack - Purple Pink Nebula ($12.99)
9. Hat - Black Hole Memorial ($27.99)
10. Tumbler - Meteor Shower ($32.99)
11. Backpack - Cosmic Aurora ($59.99)
12. Galaxy Hoodie - Memorial Explosive Energy ($49.99)
13. Galaxy T-Shirt - Big Bang ($29.99)
14. Poster - Black Hole ($19.99)
15. Sticker Pack - No Limits Zodiac ($12.99)

## File Structure
```
├── api/
│   ├── products.js          # Products API
│   ├── import-products.js  # Import products endpoint
│   └── messages.js         # Messages API
├── utils/
│   ├── printify.js        # Printify integration
│   ├── all-products.json  # Complete product config
│   └── products.json      # Printify product templates
├── shop-products.json     # Static product fallback
├── shop.html             # Shop page
├── index.html            # Landing page
├── message-wall.html     # Message wall
├── remembrance.html      # Remembrance page
└── brothers-remembrance.html  # Brothers remembrance
```

## Support
For issues, check:
- Vercel deployment logs
- Browser console for errors
- Neon database logs for API errors
