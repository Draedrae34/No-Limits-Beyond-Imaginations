# TODO - Make Silent-Spirits-Leg website “public ready”

## Acceptance target
- Prove: every public page loads without fatal JS errors, and key features exist in the DOM.
- Prove: critical flows (auth/workshop chat + PayPal checkout) via Playwright E2E specs.

## Step 1 — Add baseline smoke test for all public HTML pages
- [x] Create `public-pages.smoke.spec.js` (Playwright).
- For each `public/*.html` page:
  - goto page
  - wait for `domcontentloaded`
  - collect console errors (fail if contains "ReferenceError"/"TypeError"/"SyntaxError" or 4xx/5xx fetch errors)
  - assert `document.title` exists and that at least one key container exists (e.g., body not empty)

## Step 2 — Start server for E2E runs (if needed)
- [x] Add script `test:server` or ensure Playwright config uses correct `BASE_URL`.
- If the site is server-rendered, run `server.js` (or relevant) before tests.

## Step 3 — Expand feature coverage (next PR/iteration)
- [x] Add route-level checks for:
  - [x] shop page + add-to-cart button existence
  - [x] message wall + message rendering container
  - [x] monitor/status pages container
  - [x] portal/private workshop overlay existence

## Step 4 — Run full suite until 100% pass
- [x] `npx playwright test`
- Commit changes once green.


