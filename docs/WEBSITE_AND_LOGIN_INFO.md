# Website and Deployment Info (Vercel)
Last Updated: 2026-04-14

## Live Site
- Public: https://no-limits-beyond-limitations-1bkwckhno.vercel.app/
- Orders: https://no-limits-beyond-limitations-1bkwckhno.vercel.app/orders.html

## Hosting
- Platform: Vercel
- Vercel config: vercel.json
- Backend entry: quantum_assistant.py (via @vercel/python)

## Stripe Webhook (Vercel)
- Endpoint (either works):
  - https://no-limits-beyond-limitations-1bkwckhno.vercel.app/stripe-webhook
  - https://no-limits-beyond-limitations-1bkwckhno.vercel.app/api/stripe-webhook
- Events: checkout.session.completed
- Env vars required in Vercel:
  - STRIPE_SECRET_KEY
  - STRIPE_WEBHOOK_SECRET
  - PRINTIFY_API_TOKEN
  - PRINTIFY_SHOP_ID

## Printify Fulfillment
- Stripe webhook posts directly to Printify Orders API from quantum_assistant.py.

## Deploy
- vercel --prod
