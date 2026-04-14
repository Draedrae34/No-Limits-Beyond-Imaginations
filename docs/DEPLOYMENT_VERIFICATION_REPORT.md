# Deployment Verification Report (Vercel)

Last Verified: 2026-04-14

## Platform
- Vercel
- Config: vercel.json
- Python runtime: @vercel/python

## Webhook Endpoints
- Stripe:
  - /stripe-webhook
  - /api/stripe-webhook
- Printify:
  - Stripe webhook posts directly to Printify Orders API.

## Notes
- Netlify is not used in this repo.
