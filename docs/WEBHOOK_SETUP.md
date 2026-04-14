# Webhook Setup Guide

## 🚀 LOCAL TESTING (Heavy Lifting)

### Step 1: Start ngrok
Since Windows doesn't recognize the command yet, do exactly this:
1. Open the folder where you downloaded `ngrok.exe`.
2. Click the **Address Bar** at the top of the folder window, type `cmd`, and press **Enter**.
3. In the black window, type: `ngrok http 5000`
4. Look for the **Forwarding** line. It looks like `https://a1b2-c3d4.ngrok-free.app`. **Copy that URL.**

---

## 🔷 STRIPE DASHBOARD SETUP

1. Go to: Stripe Webhooks
2. Click **"+ Add endpoint"**
3. **Endpoint URL**: Paste your ngrok URL and add `/stripe-webhook` to the end.
   * Example: `https://a1b2-c3d4.ngrok-free.app/stripe-webhook`
4. **Select events**:
   - `checkout.session.completed`
5. Click **"Add endpoint"**.
6. Click **"Reveal"** under **Signing secret**.
7. Copy the `whsec_...` key and paste it into your `.env` file as `STRIPE_WEBHOOK_SECRET`.

---

## 🔶 PRINTIFY API SETUP

Your code handles the Printify "Heavy Lifting" automatically once these are in your `.env` file:
1. **PRINTIFY_API_TOKEN**: Get this from Printify Settings > API.
2. **PRINTIFY_SHOP_ID**: When you are on your Printify dashboard, the number in the URL (e.g., `printify.com/app/store/1234567`) is your ID.

---

## 🛠️ TROUBLESHOOTING NGROK

### "ngrok is not recognized..."
If you see this error in Windows, it means the terminal can't find the `ngrok.exe` file.
1. **Navigate to the folder** where `ngrok.exe` is located.
2. Click the **Address Bar** in File Explorer, type `cmd`, and hit Enter.
3. Run the command as: `ngrok http 5000` (or `.\ngrok http 5000`).

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
