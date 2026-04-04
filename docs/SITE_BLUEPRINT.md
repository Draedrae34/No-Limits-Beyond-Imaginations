# No Limits Beyond Limitations — Site Blueprint

This document is the **single source of truth** for every page, workflow, asset, and dependency that needs to exist from “step one” through launch. No guesswork, no duplicate decisions—everything is mapped, verified, and ready for the team (or the AI assistant) to check off.

## 1. Vision & Outcomes
- **Promise:** a cosmic, AI-powered storefront that blends storytelling, curated merch, and an owner-only workshop into one seamless experience.  
- **Must-haves:** full shop + checkout, storytelling/remembrance pages, private lab with music/studio controls, Printful + Stripe automation, owner notifications, deployable build pipeline, and accessible documentation.  
- **Success criteria per page:** content loaded, assets whitelisted, APIs wired, and post-deploy checklist from `docs/DEPLOYMENT_CHECKLIST.md` passes.

## 2. Surface Map (pages + flows)

### 2.1 Public customer experience
- `index.html` → The cosmic gateway (High-impact entry point).
- `brothers-remembrance.html` → The Heart of the Legacy. Includes the Memory Slideshow, Tribute Song, and Stand-Still Portraits of the brothers.
- `message-wall.html` → The "Honor Wall" where visitors' prayers and poems stick to the cosmos forever.
- `shop.html` → Multi-generational catalog (Newborn to Adult) featuring Galaxy-infused legacy apparel.
- Checkout endpoints (`cancel.html`, `success.html`) coordinate with `api/stripe-webhook.js` / `api/checkout.js`.
- `about.html` → The mission and story of NLBL.

### 2.2 Private owner lab + AI controls
- `private.html` → biometric/password gateway to behind-the-scenes.
- `business_dash.html`, `workshop/*` (`gallery`, `portal`, etc.) → owner dashboards for Printful fulfillment insights, analytics, AI tools (voice control, galaxy interface).  
- `web_assets/workshop` may hold older copies; treat root-level files as source of truth unless explicitly retired.

### 2.3 APIs, agents & automation
- `api/checkout.js` / `api/orders.js` / `api/auth.js` / `api/stripe-webhook.js` / `api/printful.js` → Node endpoints for Stripe/Printful, sessions, orders, orders persistence.
- `scripts/test-purchase.js` (Node) automates sample charges (mirrors `docs/TEST_PURCHASE_AUTOMATION.md`).  
- `ai_services.py`, `shop_app.py`, `chat_llama.py` support AI agent behavior and data syncing (Python).  
- `websocket_server.py`, `security_service.py`, `auth_service.py` back experimental agent/control features.

## 3. Languages, runtime & tools
- Frontend: plain HTML/CSS/JS (root-level `styles.css`, `main.css`, `css/*`, `js/*`).  
- Backend/automation: Node (Vercel serverless endpoints + `npm run dev` preview server), Python scripts for AI services, chat, Printful syncs.  
- Tools: Vercel CLI (`npm run dev:vercel`, `vercel --prod`), Printful API, Stripe API, SendGrid (optional), Git for version control, `vercel dev` for local preview when invoked directly.  
- Agents: biometric login, voice control, AI assistant (`ai_assistant.py`, `galaxy.js`, `voice-control.js`), plus `ai_services.py`.

## 4. Integrations & data flows
- **Stripe:** `stripe` package (Node) handles checkout, webhook in `api/stripe-webhook.js`. Needs env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.  
- **Printful:** `PRINTFUL_API_KEY`, `PRINTFUL_STORE_ID`; orders triggered via `api/printful.js`, dataset stored in `data/orders.json` (or `data/owner-samples.json`).  
- **SendGrid (optional):** `SENDGRID_API_KEY`, `EMAIL_FROM`, `EMAIL_ADMIN` for confirmations/logging.  
- **Notifications:** `api/auth.js` may gate owner flows; `webhook` docs in `docs/WEBHOOK_SETUP.md` specify payloads and event lists.
- **Data folders:** `data/analytics-events.json`, `data/messages.json`, `users.json`, `orders.json` (or similar) persist runtime state; never delete without migrating contents.

## 5. Assets & media
-Shared assets live in `assets/` (css, js, images) and `textures/`, `Album`, `remembrance/images`, `web_assets/images`.  
-Design assets (mockups, textures, references) spread between `NLBLITMWI_Hoodie_001`, `hoodies`, `Logo`.  
-Audio/video (remembrance music, `remembrance/music`, `web_assets/music`).  
- **Canonical rules:** prefer root-level directories unless a workspace/backup is explicitly cited; e.g., `web_assets` → static site copy for older deployment, and obsolete bundles such as `destination`, `destination(1)`, and `js (copy 1)` have been removed so only the tracked `gtm.js` remains.

## 6. Deployment pipeline
1. **Prepare:** `npm install` (Node 18+), verify `node_modules` is up to date.  
2. **Environment:** set env keys per docs (`docs/DEPLOYMENT_CHECKLIST.md`).  
3. **Local verify:** `npm run dev` (runs the local Node preview server) to preview routes; open `http://localhost:3000` (or default) in incognito, and use `npm run dev:vercel` or `npx vercel dev` when you need the full Vercel CLI experience.  
4. **Deploy:** use `npm run deploy` or `vercel --prod`. `scripts/deploy-vercel.sh`/`deploy_*.sh` exist for automated variations.  
5. **Post-deploy:** hit checklist from `docs/DEPLOYMENT_CHECKLIST.md` and update `docs/WEBSITE_LINKS.md` with live URLs + webhook statuses.

## 7. Maintenance & documentation
- Keep `docs/DEPLOYMENT_CHECKLIST.md`, `docs/WEBSITE_LINKS.md`, `docs/TEST_PURCHASE_AUTOMATION.md`, `docs/WEBHOOK_SETUP.md`, and `docs/DEPLOYMENT_SETUP.md` synced with reality—each change needs an entry.  
- `PROJECT_STRUCTURE.txt` already mirrors the filesystem; update it whenever a new directory is introduced or retired.  
- Track AI agent state in `ai_memory.json`.

## 8. Duplicate/confusing directories (cleanup checklist)
| Path | Notes | Action |
| --- | --- | --- |
| `js (copy 1)` | old Google Tag Manager export | Removed; only `js/` remains as the canonical script bundle. |  
| `destination` + `destination(1)` | obsolete GTM destination payloads | Removed; `gtm.js` is the tracked analytics bundle. |  
| `Important_html` | legacy copies of public and private pages/instructions | `login.html` + `workshop.html` moved to the repo root, upload guides moved to `docs/`, and this folder was deleted. |  
| js/portal.js | redundant transition logic | Retired in favor of root-level portal-transition.js. |
| `web_assets` | near-full site copy (includes its own `/workshop`) | Treat as a read-only archive; keep root copies in sync before removing it from deployment. |  
| `web_assets/css/main.css` vs `css/main.css` | keep one canonical file; update HTML to point to only one path |  
| `docs/PROJECT_STRUCTURE.txt` vs `plans/` vs root | Keep blueprint doc updated so `projects` folder no longer needed |

## 9. Local restoration checklist
1. `git pull` (if remote changed).  
2. `npm install` (Node ≥18).  
3. Set up `.env` from `.env.example` with required keys (can stub placeholder for local preview).  
4. `npm run dev` to preview; open each page listed in section 2 and log any missing assets or repeated files.  
5. Run `npm run test-purchase` (optional) to exercise webhook logic.  

## 10. Governance & next moves
- Always reference this blueprint before adding files or renaming directories.  
- If you update a page or API, note the changes in `docs/PROJECT_STRUCTURE.txt` and, where applicable, `docs/DEPLOYMENT_CHECKLIST.md`.  
- Once the canonical repo is stable, consider archiving duplicate folders (per section 8) and listing them as retired references at the bottom of this doc.

## 11. Galaxy Journey map (public experience)
- **Initial greeting & portal gate (`index.html`, inline `<script>`):** overlay (`greeting-overlay`, `greeting-text`, `enter-btn`) types the heartfelt manifesto. `createParticles` + `initStarCanvas` build the cosmic background (`particles`, `star-canvas`). Countdown banner (`grand-opening-banner`) runs 30-day timer and CTA code `LABLAUNCH`.  
- **Hero → features → quote:** after overlay fades, header/nav fade in (`site-header`, nav links to shop/wall/remembrance/about). Hero section (`hero-section` with `.hero-logo`, `.hero-description`, CTA buttons) introduces story and prompts visitors to “launch.” Features grid (`content-section`) details premium products, memorial storytelling, and movement invite. Quote section (`quote-section`) closes with the founder’s promise before the footer.  
- **Security & secret portal triggers:** `secretTapCount` (logo triple-tap + Ctrl+Shift+P) routes to `private.html` for authorized access; footer/console messaging reinforce the brand. `openSecretPortal` is the single canonical path into the owner-only lab from the public site.  
- **Styling & assets:** root `styles.css`, `main.css`, `Logo/logo.png`, `favicon.svg`, `fonts.googleapis.com` for typography, plus `particles`/star animations and `grand-opening` CSS (rose dividers) to keep the galaxy vibe irreproducible.  
- **Dependencies:** `index.html` handles all hero logic inline; no external JS beyond the inline script, so keep that file focused on these sections—any refactor should respect the typewriter/counter/portal responsibilities that currently live there.

## 12. Private AI workshop map (`private.html`, `workshop.html`, `access-control.js`)
- **Authentication & gating:** `access-control.js` drives onboarding—inserts login modal, stores `nlbl_auth_token`, routes unauthorized visitors back to `index.html`. `private.html` also loads `AccessControl.checkAuth()`, `showLoginModal()`, and `AccessControl.logout()` so every entry point hits the same gate (no external leaks).  
- **Core sections (`private.html` IDs):**
  - `#home`: hero stats (projects/ideas/savings counters).  
  - `#ai-assistant`: chat history, prompt textarea, quick actions (send/clear/export), list of active capabilities (quantum processing, creative design).  
  - `#jarvis`: Three.js jarvis-3d view (`initJarvisScene` spinner), control grid for scans/optimize/deploy/backups, status row showing `Jarvis Core`, `Neural Link`, `Processing`.  
  - `#analytics`: Chart.js dashboards (`traffic-chart`, `revenue-chart`, `behavior-chart`, `ai-performance-chart`), KPI cards (total revenue, visitors, conversion, session), plus trending list citing `updateTrendingList`.  
  - `#music-studio`: music visualizer bars, controls (genre/mood/BPM/duration), generate/export buttons, and recent track list; `initMusicVisualizer` animates bars every 100ms.  
  - `#knowledge-base`: search field, category buttons, dynamic card grid for ideas/projects/research/blueprints.  
  - `#blueprints`: six blueprint cards (image, content, code, video, music, DNA) that become launchpads for generative tools.  
  - `#owner-samples`: Owner Sample Logbook form (product, quantity, date, speed, notes) plus table synced via `/api/owner-samples`. JavaScript (`loadOwnerSamples`, `submitOwnerSample`, `refreshOwnerSamples`, `updateSampleStatus`) keeps table and KPI text aligned with backend state.
- **Workshop-specific page (`workshop.html`):** duplicate/alternate UI that is still referenced in docs risk; keep in sync with `private.html` if whichever becomes canonical. It also loads `styles.css`, `script.js` (if reintroduced) for the login/AI assistant, includes music/generation controls, card sections, and easier `fetch` calls to `/api/ai/chat`, `/api/ai/generate`, `/api/auth/login`, `/api/security/scan`.  
- **Backend integrations:** `private.html` fetches `/api/analytics/dashboard`, `/api/owner-samples`, `/api/owner-samples` (POST/PATCH), and the AccessControl API (`/api/auth`), while `workshop.html` also hits `/api/ai/chat`, `/api/ai/generate`, `/api/ai/security/scan`, and `/api/auth/login` for MFA tokens.  
- **3D & charts stack:** Three.js + OrbitControls (CDN) animate Jarvis; Chart.js draws analytics; both rely on `styles.css` for gradients and `quantum-field` overlays. Keep the canvases/responsive listeners in place whenever adjusting the UI.  
- **Security story:** `private.html` displays `#access-denied` overlay until `AccessControl.checkAuth()` confirms the token. All actions (music generation, jarvis scans, owner-sample logs) expect these APIs to reject unauthorized requests—never expose these endpoints elsewhere or remove the token check.
