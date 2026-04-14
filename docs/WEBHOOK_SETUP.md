# 🚀 Printify & Stripe Webhook Setup

## 1. Start the Bridge (ngrok)
1. Open the folder containing `ngrok.exe`.
2. Type `cmd` in the address bar and hit Enter.
3. Run: `ngrok http 5000`
4. Copy the "Forwarding" URL (e.g., `https://random-id.ngrok-free.app`).

## 2. Configure Stripe
1. Go to Stripe Webhooks.
3. Click **"+ Add endpoint"**
3. **Endpoint URL**: `[YOUR_NGROK_URL]/stripe-webhook`
4. **Select events**: `checkout.session.completed`
5. Click **"Add endpoint"**.
6. Copy the **Signing secret** (`whsec_...`) into your `.env` file as `STRIPE_WEBHOOK_SECRET`.

---

## 3. Printify Integration
Fulfillment is handled automatically by the Flask app using these `.env` variables:
1. **PRINTIFY_API_TOKEN**: Found in Printify Settings > API.
2. **PRINTIFY_SHOP_ID**: Found in your browser URL when viewing your Printify store.

---

## ✅ Checklist for Automation

| Variable | Status |
|----------|--------|
| `STRIPE_SECRET_KEY` | ✅ Configured |
| `STRIPE_WEBHOOK_SECRET` | ⏳ Get from Stripe |
| `PRINTIFY_API_TOKEN` | ✅ Configured |
| `PRINTIFY_SHOP_ID` | ✅ Configured |

---
**Note:** Netlify and Printful are no longer used. This system is strictly Flask + Printify.

### "ngrok is not recognized..."
If you see this error in Windows, it means the terminal can't find the `ngrok.exe` file.
1. **Navigate to the folder** where `ngrok.exe` is located.
2. Click the **Address Bar** in File Explorer, type `cmd`, and hit Enter.
3. Run the command as: `ngrok http 5000` (or `.\ngrok http 5000`).
---

## 🧪 TEST YOUR WEBHOOK
1. Go to Stripe Webhooks.
2. Click on your ngrok endpoint.
3. Click **"Test in local environment"** or use the Stripe CLI.
4. Watch your Flask terminal for "Printify Order Created Successfully".
