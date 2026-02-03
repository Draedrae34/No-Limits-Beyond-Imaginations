# 🔮 Printful + Stripe Integration Setup Guide

## Overview
Your Magicians Beyond Limitations shop is now fully integrated with:
- **Printful** - For product catalog and fulfillment
- **Stripe** - For secure payment processing

---

## Step 1: Get Your API Keys

### Printful API Token
1. Go to [Printful Dashboard](https://www.printful.com/dashboard)
2. Navigate to **Settings → API**
3. Generate a new API token
4. Copy your token

### Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API Keys**
3. Copy your:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)
4. Go to **Webhooks** and create webhook for:
   - Event: `payment_intent.succeeded`
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Copy your webhook signing secret

---

## Step 2: Configure Environment Variables

1. Copy `.env.template` to `.env`:
```bash
cp web_assets/api/.env.template web_assets/api/.env
```

2. Edit `web_assets/api/.env` and add your keys:
```env
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PRINTFUL_API_TOKEN=xxx
```

⚠️ **NEVER commit `.env` to git - it's secret!**

---

## Step 3: Update Frontend

The shop page (`products/magicians-collection.html`) automatically:
- Loads your Stripe key from backend
- Fetches products from Printful
- Displays them in real-time
- Handles payments securely

---

## Step 4: How It Works

### Customer Journey:
1. Customer browses products (pulled from Printful)
2. Adds items to cart
3. Clicks "Checkout"
4. Enters email + card details (Stripe handles encryption)
5. Payment processed securely
6. Order created in Printful automatically
7. Printful ships directly to customer

### Order Flow:
```
Customer pays (Stripe) → Payment verified → Order created (Printful) 
→ Printful prints → Ships → Customer receives
```

---

## Step 5: File Structure

```
web_assets/
├── api/
│   ├── ecommerce_api_new.py    ← Printful integration
│   ├── stripe_api_new.py       ← Stripe integration
│   ├── server.py               ← Register both blueprints
│   └── .env                    ← Your secret keys (DO NOT SHARE)
└── products/
    └── magicians-collection.html ← Customer shop
```

---

## Step 6: Test Payment Flow

### Test Card Numbers (Stripe):
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Exp: Any future date
- CVC: Any 3 digits

### Test with Printful:
- Your account can create test orders
- No actual printing/shipping happens
- Perfect for validating integration

---

## Step 7: Deploy to Production

When ready to go live:

1. Use **live** Stripe keys (not test)
2. Ensure HTTPS on your domain
3. Set up proper Stripe webhook on production URL
4. Test complete payment flow
5. Monitor orders in both Stripe and Printful dashboards

---

## Files You Now Have:

✅ **ecommerce_api_new.py** - Printful product catalog + order creation
✅ **stripe_api_new.py** - Payment processing  
✅ **.env.template** - Configuration template
✅ **magicians-collection.html** - Full Stripe + Printful shop

---

## Troubleshooting

**Products not loading?**
- Check PRINTFUL_API_TOKEN in `.env`
- Verify API token is active in Printful dashboard
- Check browser console for errors

**Payment failing?**
- Verify STRIPE_SECRET_KEY in `.env`
- Check test card numbers above
- Ensure HTTPS is enabled

**Orders not appearing?**
- Check Stripe webhooks are configured
- Verify customer email is correct
- Check Printful dashboard for new orders

---

## Next Steps:

1. ✅ Add your API keys to `.env`
2. ✅ Test payment with test card
3. ✅ Verify order appears in Printful
4. ✅ Monitor fulfillment status
5. ✅ Go live with production keys

---

## Your Shop is Now:
🔒 **Secure** - Stripe handles all payment encryption
🚀 **Scalable** - Printful handles production
⚡ **Instant** - Orders auto-created after payment
🌍 **Global** - Printful ships worldwide

**That's it! Your Magicians Beyond Limitations shop is ready to sell! 🎉**
