# 🤖 Automated Test Purchase

Use this script after deployment to confirm the full checkout → webhook → Printful pipeline works.

## 1. Requirements
1. Deployment is live (`https://[your-domain]` or `https://nolimitsbeyondlimitations.com`).
2. Environment variables set (Stripe, Printful, SendGrid/extras) per `docs/DEPLOYMENT_CHECKLIST.md`.
3. Stripe CLI installed + logged in (for simulating `checkout.session.completed` events) OR use the live checkout link from the script.

## 2. Run the automation
```bash
npm run test-purchase -- --url https://nolimitsbeyondlimitations.com
```

### What it does
- Calls `/api/checkout` with a dummy cart item.
- Prints the resulting Stripe session ID and checkout URL.
- Leaves the remaining “finish the flow” steps for Stripe/Printful (see below).

## 3. Finish the purchase
1. Open the checkout URL in a private tab and process payment with Stripe test card (e.g., `4242 4242 4242 4242`).
2. After the payment, use Stripe CLI or the dashboard to replay the `checkout.session.completed` event so the webhook runs locally:
   ```bash
   stripe listen --forward-to https://nolimitsbeyondlimitations.com/api/stripe-webhook
   ```
   or use `stripe trigger checkout.session.completed`.
3. Confirm `data/orders.json` now includes the session entry and `admin.html`/Printful dashboard shows the order.

## 4. (Optional) Verify Printful webhook
- Ensure Printful is configured to call `/api/printful-webhook` and that webhooks reference the same domain.
- Use Printful’s dashboard to send a test webhook; the order should update in `data/orders.json`.

When each step passes, you’ve automated an end-to-end test: checkout → webhook → Printful + email logging. Let me know if you’d like me to schedule this as part of a CI pipeline or wrap it in a Git hook.
