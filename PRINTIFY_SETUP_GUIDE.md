# Printify Setup Guide (Vercel)

This project runs on Vercel and uses Printify for fulfillment.

## Required env vars (Vercel)
- PRINTIFY_API_TOKEN
- PRINTIFY_SHOP_ID

## Stripe -> Printify
- Stripe webhook handler is implemented in quantum_assistant.py.
- Webhook endpoints (both work on Vercel):
  - /stripe-webhook
  - /api/stripe-webhook

## Notes
- There is no Netlify deployment in this repo.
