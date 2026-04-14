# Live Payment Setup (Vercel + Stripe + Printify)

## Vercel Environment Variables
Set these in Vercel Dashboard -> Project -> Settings -> Environment Variables:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- PRINTIFY_API_TOKEN
- PRINTIFY_SHOP_ID

## Stripe Webhook Endpoint
Stripe Dashboard -> Developers -> Webhooks -> Add endpoint:
- Use one of these (both route to the same handler on Vercel):
  - https://no-limits-beyond-limitations-1bkwckhno.vercel.app/stripe-webhook
  - https://no-limits-beyond-limitations-1bkwckhno.vercel.app/api/stripe-webhook

Select events:
- checkout.session.completed

## What Happens On Webhook
- Vercel receives the webhook -> quantum_assistant.py validates signature -> creates a Printify order.

## Local Testing (Stripe CLI)
- stripe login
- stripe listen --forward-to http://localhost:5000/stripe-webhook
- Put the returned whsec_... into STRIPE_WEBHOOK_SECRET locally
- stripe trigger checkout.session.completed
