# Webhook Setup Guide

## 🔷 STRIPE WEBHOOK SETUP

### Step 1: Go to Stripe Dashboard
1. Open browser and go to: https://dashboard.stripe.com/webhooks
2. Login with your Stripe account
3. Click **"+ Add endpoint"**

### Step 2: Add Webhook Endpoint
1. **Endpoint URL**: Copy and paste this exact URL:
```
https://spiffy-sable-cca254.netlify.app/.netlify/functions/stripe-webhook
```

2. **Select events to listen to**: Check these 3 events:
   - ✅ `checkout.session.completed` (most important!)
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`

3. Click **"Add endpoint"** (blue button at bottom)

### Step 3: Get Your Webhook Secret
1. After creating the webhook, scroll down to "Signing secret"
2. Click to reveal: `whsec_...` (starts with whsec_)
3. **Copy this entire secret** (you'll need it for the next step)

### Step 4: Add Secret to Netlify
Run this command in terminal:
```bash
cd /home/aundrae/Documents/Owner_Workshop/AI_v0
npx netlify env:set STRIPE_WEBHOOK_SECRET "whsec_YOUR_SECRET_HERE"
```

Replace `whsec_YOUR_SECRET_HERE` with the actual secret you copied!

---

## 🔶 PRINTFUL WEBHOOK SETUP

### Step 1: Go to Printful Dashboard
1. Open browser and go to: https://www.printful.com/dashboard/store/api
2. Login with your Printful account
3. Scroll down to **"Webhooks"** section

### Step 2: Add Webhook
1. Click **"Add webhook"** or **"Create webhook"**
2. **Webhook URL**: Copy and paste this exact URL:
```
https://spiffy-sable-cca254.netlify.app/.netlify/functions/printful-webhook
```

3. Select events to receive (you can select all):
   - Order created
   - Order approved
   - Order fulfilled
   - Order cancelled
   - etc.

4. Click **"Save"** or **"Create"**

### Step 3: Get Your Webhook Secret
1. After creating, look for "Secret key" or "Webhook secret"
2. Copy the secret key

### Step 4: Add Secret to Netlify
Run this command in terminal:
```bash
cd /home/aundrae/Documents/Owner_Workshop/AI_v0
npx netlify env:set PRINTFUL_WEBHOOK_SECRET "YOUR_PRINTFUL_SECRET_HERE"
```

Replace `YOUR_PRINTFUL_SECRET_HERE` with the actual secret!

---

## ✅ VERIFY SETUP

After adding both secrets, run:
```bash
cd /home/aundrae/Documents/Owner_Workshop/AI_v0
npx netlify env:list
```

You should see all 5 variables:
- STRIPE_SECRET_KEY ✅
- STRIPE_PUBLISHABLE_KEY ✅
- STRIPE_WEBHOOK_SECRET ✅
- PRINTFUL_API_KEY ✅
- PRINTFUL_WEBHOOK_SECRET ✅

---

## 🔄 DEPLOY AGAIN

After adding webhook secrets, deploy once more:
```bash
cd /home/aundrae/Documents/Owner_Workshop/AI_v0
npx netlify deploy --prod
```

---

## 🧪 TEST YOUR WEBHOOKS

### Test Stripe:
1. Go to https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `checkout.session.completed`
5. Check the function logs to see if it worked

### Test Printful:
1. Go to https://www.printful.com/dashboard/store/api
2. Find your webhook
3. Click "Send test" or "Test webhook"
4. Check the function logs

---

## 📋 COMPLETE ENVIRONMENT VARIABLES CHECKLIST

| Variable | Status | How to Get |
|----------|--------|------------|
| `STRIPE_SECRET_KEY` | ✅ Done | From Stripe Dashboard > Developers > API keys |
| `STRIPE_PUBLISHABLE_KEY` | ✅ Done | From Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | ⏳ Pending | From Stripe Dashboard > Webhooks |
| `PRINTFUL_API_KEY` | ✅ Done | From Printful Dashboard > Store > API |
| `PRINTFUL_WEBHOOK_SECRET` | ⏳ Pending | From Printful Dashboard > Store > API > Webhooks |

---

## 🎉 Once Complete!

Your website will have FULL automation:
- ✅ Customer pays on your site
- ✅ Stripe confirms payment via webhook
- ✅ Order automatically sent to Printful
- ✅ Printful prints and ships product
- ✅ Customer gets tracking info
- ✅ You get notified of all progress

Let me know when you've added the webhook secrets and I'll help you deploy!
