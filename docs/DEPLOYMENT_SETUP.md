# Live Payment Setup - Complete Instructions

## ✅ API Keys Already Configured

Your live Stripe and Printful API keys have been integrated:

### Stripe Keys (LIVE MODE):
- **Publishable Key:** `pk_live_your_key_here`
- **Secret Key:** `sk_live_your_key_here`

### Printful Key (LIVE MODE):
- **API Key:** `your_printful_key_here`

---

## 🔧 Netlify Environment Setup (CRITICAL)

You MUST set these environment variables in Netlify for payments to work:

### Step 1: Go to Netlify Dashboard
1. Visit: https://app.netlify.com/sites/spiffy-sable-cca254/overview
2. Click **"Site settings"** (bottom left)
3. Click **"Environment variables"** (left sidebar)

### Step 2: Add These Variables

Add ONE variable at a time:

| Variable Name | Value |
|---------------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_your_key_here` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_your_key_here` |
| `PRINTFUL_API_KEY` | `your_printful_key_here` |

### Step 3: Deploy with Updated Settings

After adding environment variables, deploy again:

```bash
cd /home/aundrae/Documents/Owner_Workshop/AI_v0
npx netlify deploy --prod
```

---

## 🛠️ Stripe Webhook Setup (REQUIRED for Order Confirmation)

### Step 1: Get Your Webhook Secret
1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Endpoint URL: `https://spiffy-sable-cca254.netlify.app/.netlify/functions/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Click **"Add endpoint"**
6. Copy the **"Signing secret"** (starts with `whsec_`)

### Step 2: Add Webhook Secret to Netlify
1. In Netlify > Site settings > Environment variables
2. Add: `STRIPE_WEBHOOK_SECRET` = `whsec_your_webhook_secret_here`

---

## 🎯 Printful Webhook Setup (REQUIRED for Order Tracking)

### Step 1: Get Your Webhook Secret
1. Go to https://www.printful.com/dashboard/store/api
2. Scroll to **"Webhooks"**
3. Add webhook URL: `https://spiffy-sable-cca254.netlify.app/.netlify/functions/printful-webhook`
4. Copy the **"Secret key"**

### Step 2: Add Webhook Secret to Netlify
1. In Netlify > Site settings > Environment variables
2. Add: `PRINTFUL_WEBHOOK_SECRET` = `your_printful_webhook_secret_here`

---

## ✅ Testing Your Live Payments

### After Setup Complete:
1. Visit: https://spiffy-sable-cca254.netlify.app
2. Add a product to cart
3. Click "Checkout"
4. Enter test card details:
   - Card: Use a real card (this is LIVE mode)
   - Email: Your email
   - Name: Test Customer

### Test Card (Sandbox):
If you want to test without charging:
- Card: `4242 4242 4242 4242`
- Exp: Any future date (e.g., 12/27)
- CVC: `123`
- ZIP: `90210`

**NOTE:** Since you're using LIVE keys, this will charge real money!

---

## 📋 Complete Environment Variables List

| Variable | Value | Required |
|----------|-------|----------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | ✅ YES |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | ✅ YES |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ⚠️ For webhooks |
| `PRINTFUL_API_KEY` | `WkvAEa...` | ✅ YES |
| `PRINTFUL_WEBHOOK_SECRET` | `...` | ⚠️ For webhooks |

---

## 🚀 Deploy Command

```bash
cd /home/aundrae/Documents/Owner_Workshop/AI_v0
source .venv/bin/activate
npx netlify deploy --prod
```

---

## 🎉 After Deployment

Your website will be LIVE with real payments at:
**https://spiffy-sable-cca254.netlify.app**

Customers can:
- Browse products
- Design custom clothes
- Pay with credit/debit cards
- Track orders online

All payments go directly to your Stripe account connected to your bank!
