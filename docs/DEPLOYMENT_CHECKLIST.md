# 🚀 Deployment Checklist

Use this checklist every time you push a new release so the storefront, checkout, and private lab stay in sync.

## 1. Preflight (local/branch)
1. `git status` → clean working tree (commit or stash unrelated assets).
2. Run `npm run lint` and `npm run format` if you touched JS/CSS/HTML so static checks stay green.
3. Smoke-test locally: `npm run dev`? or open `index.html` + `shop.html`/`message-wall.html`. Make sure the greeting, cart, and APIs behave before deploying.
4. Update `docs/WEBSITE_LINKS.md` if a new custom domain or hero copy changes.

## 2. Set environment variables (Vercel dashboard / your host)
1. `STRIPE_SECRET_KEY` – live secret for checkout API (>= Node 18 now).
2. `STRIPE_WEBHOOK_SECRET` – from Stripe dashboard → Webhooks → signing secret.
3. `PRINTFUL_API_KEY` – Printful token (store-level preferred).
4. `PRINTFUL_STORE_ID` – numeric ID for the Printful store that receives orders.
5. `SENDGRID_API_KEY` – optional but required if confirmation emails should go live.
6. `EMAIL_FROM` – friendly sender address (e.g., `No Limits Beyond Limitations <noreply@yourdomain.com>`).
7. `EMAIL_ADMIN` – receive BCC copies (optional).
</br>*Optional:* align `NODE_ENV=production` and any analytics keys you need.

## 3. Deploy
1. Ensure the remote (e.g., Vercel) points to this repo.
2. Run your preferred deploy command from the repo root:
   ```bash
   npm run deploy
   # or
   vercel --prod
   # or
   chmod +x deploy-vercel.sh && ./deploy-vercel.sh
   ```
3. Wait for the Vercel (or other host) build log to finish, then open the generated URL (default `https://[project].vercel.app`).

## 4. Vercel settings sanity check
1. In **Settings → Git**, confirm the linked repo is `Draedrae34/No-Limits-Beyond-Imaginations`, the production branch is `main`, and **Automatic Deployments** are enabled for pushes (and PRs if you preview before merging).
2. Keep **Prioritize Production Builds** enabled so production deploys skip the queue, and ensure the Node.js version matches your `package.json`/`engines`.
3. If you need manual control, create a **Deploy Hook** (name + branch) and store the URL/instructions in this checklist so teammates know how to curl it to trigger a rebuild without new commits.

## 5. Post-deploy verifications
1. Confirm the public domain (e.g., `https://nolimitsbeyondlimitations.com`) is reachable and shows the greeting/copy.
2. Run a test purchase (Stripe test card) to ensure:
   * `/api/checkout` creates a session.
   * Stripe webhook fires (inspect logs), writes `data/orders.json`, and returns 200.
   * Printful receives the order (check Printful dashboard or `admin.html` > Printful tab).
   * Confirmation email sends (if SENDGRID key set) or the payload is logged (see `api/stripe-webhook.js:204`).
3. Submit a message on `message-wall.html` to ensure `api/messages` records it in `data/messages.json`.
4. Log into your private workshop (`/private.html` via portal) and ensure the AI assistant + voice controls still work.

## 6. Webhooks & DNS
1. In Stripe dashboard:
   * Webhook URL: `https://[your-domain]/api/stripe-webhook`
   * Listen for `checkout.session.completed`, `payment_intent.payment_failed`, and `charge.refunded`.
2. In Printful dashboard:
   * Webhook endpoint: `https://[your-domain]/api/printful-webhook`
   * Set events: order.created, order.updated.
3. Point your custom domain to the deployment (DNS A/CNAME records if needed).

## 7. Routine updates
1. After every new product or collection:
   * Add product metadata (variant IDs) to `shop.html` or other catalog pages.
   * Update `docs/PROJECT_STRUCTURE.txt`/`PLAN`s if you add new admin tools.
2. When changing APIs or secrets, refresh the Vercel environment variables and retest the relevant flow.

Keep this doc handy so every deploy runs the same route. Let me know if you want me to script any step or automate the test purchase. 
