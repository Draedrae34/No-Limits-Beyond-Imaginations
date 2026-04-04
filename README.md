# No Limits Beyond Limitations

## Cosmic & AI-powered Clothing Lab

The storefront is a guided journey—opening greeting, story, brothers, honoring, then the shop and checkout—while your private workshop keeps everything else (AI assistant, trend scouting, owner tools) hidden behind `private.html`. Designs are authored in-house, synced to Printful for fulfillment, and shipped worldwide with live analytics and owner sample tracking.

## What you get
- Multi-step public experience (`index.html`, `story-remembrance.html`, `brothers` docs) that ends at the catalog.
- Private lab (`private.html`, `business_dash.html`, `shop_app.py`, AI services) that only you see and can use for music production, marketing intel, and printing new garments.
- Fulfillment automation (Printful today, Printify coming soon) plus helper scripts in `scripts/` for catalog publishing, analytics ingestion, and automated test purchases. See the `printify:catalog` script under `npm run printify:catalog` for bulk syncs when you switch providers.
- A deploy checklist (`docs/DEPLOYMENT_CHECKLIST.md`), webhook guide, and analytics/owner-sample persistence data in `data/`.

## Getting started locally

1. Install dependencies: `npm install` (Node 18+). The repo uses Astro/Node as shown in `package.json`.
2. Set your env variables (copy `.env.example`). Required keys:
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `PRINTFUL_API_KEY`, `PRINTFUL_STORE_ID`
   - `SENDGRID_API_KEY` + `EMAIL_FROM`, `EMAIL_ADMIN` (optional)
   - `NODE_ENV=development`
3. Upload media (remembrance, story, and clothing assets):
   - Copy `env/r2_credentials.env.example` to `env/r2_credentials.env` and fill it with your Cloudflare R2 account ID, access key, secret, and bucket name.
   - Run `npm run upload:media`. That helper syncs `remembrance/photos/`, `uploads/my-story/`, and `Clothing_Product/**/*` to R2, sets `MEDIA_BASE_URL`, and rebuilds the manifests for the remembrance and story pages.
4. Run the dev server (not strictly necessary, but a great sanity check): `npm run dev` starts the bundled Node preview server on `http://localhost:3000`. If you need the full Vercel CLI experience, run `npm run dev:vercel` or `npx vercel dev`.
4. Update `docs/WEBSITE_LINKS.md` or `data/catalog-metadata.json` before each catalog refresh so Printful can publish through `scripts/publish_catalog.py`.

### Printify metadata helpers
- Set `PRINTIFY_API_TOKEN` in your local `.env` file before using these scripts.
- `npm run printify:catalog` uploads your designs assuming you already know the blueprint/provider IDs.
- `python scripts/printify_catalog_info.py --list-blueprints` lists catalog blueprints (shows IDs + titles).
- `python scripts/printify_catalog_info.py --list-providers` lists every Printify provider (ID + name + country).
- `python scripts/printify_catalog_info.py --blueprint-id <id>` dumps the details of a single blueprint so you can double-check its placeholders.

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

### Vercel settings sanity check
* Under **Settings → Git**, make sure Automatic Deployments stay toggled on for pushes (and preview branches if you want PR previews), the production branch is still `main`, and the `No-Limits-Beyond-Imaginations` repo is the one hooked up.
* Enable **Prioritize Production Builds** so the live branch always skips the queue, and keep `Node.js Version` aligned with your `engines` setting (Node 18+).
* If you want to trigger rebuilds outside GitHub, create a Deploy Hook (name it “manual main deploy” or similar) and document the URL somewhere secure—calling `curl https://vercel.com/deploy/<hook>` from a script lets you rebuild after bulk uploads, Printful syncs, or analytics updates without pushing code.

## Testing & analytics
- Use `docs/TEST_PURCHASE_AUTOMATION.md` to automate a Stripe/Printful test order.
- Check `data/analytics-events.json` to verify visits, conversions, and owner sample logs captured from `api/analytics`.
- Keep the owner sample tracking script (`scripts/test-purchase.js`) aligned with Printful and `data/owner-samples.json` so every release ships a reserved sample order.

## Helpful lore
- `docs/WEBHOOK_SETUP.md` walks you through Stripe + Printful webhook URLs.
- `docs/DEPLOYMENT_SETUP.md` explains the infrastructure (Vercel, Printful store, Stripe webhook settings).
- `docs/REVOLUTIONARY_UPGRADES.md` holds ideas for future AI-driven merch drops.

## CI & Secrets Guardrails

- A GitHub Actions workflow (`.github/workflows/ci.yml`) now runs on every push/pull request to `main`. It installs dependencies, runs `npm run ci-test` (same as `npm run lint`), and optionally checks formatting (`npm run format -- --check`).
- Configure the repo secrets (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `PRINTFUL_API_TOKEN`, `OPENAI_API_KEY`, etc.) through GitHub’s **Settings → Secrets & variables** so the action can access the keys without checking them into source control. Your “big dawg” directory can stay private on your machine; the CI reads the secrets instead.
- Once CI passes, it becomes safe to hook this workflow into your deployment pipeline (Vercel, GitHub Pages, etc.) so the branch only deploys when the suite finishes cleanly.

## Quick Sample Flow

Need to check the backend flows fast? Run the helper script:

```bash
pip install -r requirements.txt
python scripts/sample_flow.py --prompt "Purple nebula biker hoodie exploding with light"
```

It hits `/api/ai/generate`, logs a design through `/api/owner-samples`, and then polls `/api/analytics/dashboard` so you can see the resulting KPIs on the private analytics board. Keep `shop_app.py` running (default `http://127.0.0.1:5001`) with your Printful/Stripe/OpenAI secrets in the local `.env` file before running the script (these same secrets should live as GitHub repo secrets for CI/deployments).

Need a refresh or want me to draft the deployment checklist into `docs/DEPLOYMENT_CHECKLIST.md` more verbosely? (Already updated here.)
