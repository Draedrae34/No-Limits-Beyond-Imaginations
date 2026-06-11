# TODO - Make Silent-Spirits-Leg website “public ready”

## Acceptance target
- Prove: every public page loads without fatal JS errors, and key features exist in the DOM.
- Prove: critical flows (auth/workshop chat + PayPal checkout) via Playwright E2E specs.

## Step 1 — Add baseline smoke test for all public HTML pages
- Create `public-pages.smoke.spec.js` (Playwright).
- For each `public/*.html` page:
  - goto page
  - wait for `domcontentloaded`
  - collect console errors (fail if contains "ReferenceError"/"TypeError"/"SyntaxError" or 4xx/5xx fetch errors)
  - assert `document.title` exists and that at least one key container exists (e.g., body not empty)

## Step 2 — Start server for E2E runs (if needed)
- Add script `test:server` or ensure Playwright config uses correct `BASE_URL`.
- If the site is server-rendered, run `server.js` (or relevant) before tests.

## Step 3 — Expand feature coverage (next PR/iteration)
- Add route-level checks for:
  - shop page + add-to-cart button existence
  - message wall + message rendering container
  - monitor/status pages container
  - portal transition overlay existence

## Step 4 — Run full suite until 100% pass
- `npx playwright test`
- Commit changes once green.

