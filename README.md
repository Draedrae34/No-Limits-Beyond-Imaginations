# No Limits Beyond Limitations

## Cosmic & AI-powered Clothing Lab

The storefront is a guided journey—opening greeting, story, brothers, honoring, then the shop and checkout—while your private workshop keeps everything else (AI assistant, trend scouting, owner tools) hidden behind `private.html`. Designs are authored in-house, synced to Printful for fulfillment, and shipped worldwide with live analytics and owner sample tracking.

## What you get
- Multi-step public experience (`index.html`, `story-remembrance.html`, `brothers` docs) that ends at the catalog.
- Private lab (`private.html`, `business_dash.html`, `shop_app.py`, AI services) that only you see and can use for music production, marketing intel, and printing new garments.
- Printful + Stripe integration with helper scripts in `scripts/` for catalog publishing, analytics ingestion, and automated test purchases.
- A deploy checklist (`docs/DEPLOYMENT_CHECKLIST.md`), webhook guide, and analytics/owner-sample persistence data in `data/`.

## Getting started locally

1. Install dependencies: `npm install` (Node 18+). The repo uses Astro/Node as shown in `package.json`.
2. Set your env variables (copy `.env.example`). Required keys:
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `PRINTFUL_API_KEY`, `PRINTFUL_STORE_ID`
   - `SENDGRID_API_KEY` + `EMAIL_FROM`, `EMAIL_ADMIN` (optional)
   - `NODE_ENV=development`
3. Run the dev server (not strictly necessary, but a great sanity check): `npm run dev` or open the HTML files in `public/` style directories.
4. Update `docs/WEBSITE_LINKS.md` or `data/catalog-metadata.json` before each catalog refresh so Printful can publish through `scripts/publish_catalog.py`.

## Deploying

### Manual (local)
```bash
npm run deploy   # runs `vercel --prod` (package.json)
```
Use `bash scripts/cleanup_deploy.sh` before deployment to archive large design directories and keep the build under 100 MB.

### GitHub → Vercel auto-deploy
1. Connect this repository to Vercel (via the dashboard “New Project” → GitHub). If you haven’t yet:
   * Install the Vercel GitHub app for `Draedrae34/No-Limits-Beyond-Imaginations`.
   * Allow the app to access the repo.
2. Link the repo to an existing Vercel project (should already be `no-limits-beyond-limitations`). If you rename the repo, update the project settings.
3. In Vercel’s “Git” tab:
   * Set the production branch to `main`.
   * Enable **Automatic Deployments** for pushes and pull requests.
4. Add environment variables in Vercel’s dashboard (same list as local) so the build/test environment stays in sync.
5. Every push to `main` now runs the same `npm run deploy`, hitting Vercel’s build pipeline and giving you `https://no-limits-beyond-limitations-*.vercel.app` while aliasing the custom domain (`nolimitsbeyondlimitations.com`).

## Testing & analytics
- Use `docs/TEST_PURCHASE_AUTOMATION.md` to automate a Stripe/Printful test order.
- Check `data/analytics-events.json` to verify visits, conversions, and owner sample logs captured from `api/analytics`.
- Keep the owner sample tracking script (`scripts/test-purchase.js`) aligned with Printful and `data/owner-samples.json` so every release ships a reserved sample order.

## Helpful lore
- `docs/WEBHOOK_SETUP.md` walks you through Stripe + Printful webhook URLs.
- `docs/DEPLOYMENT_SETUP.md` explains the infrastructure (Vercel, Printful store, Stripe webhook settings).
- `docs/REVOLUTIONARY_UPGRADES.md` holds ideas for future AI-driven merch drops.

Need a refresh or want me to draft the deployment checklist into `docs/DEPLOYMENT_CHECKLIST.md` more verbosely? (Already updated here.)
