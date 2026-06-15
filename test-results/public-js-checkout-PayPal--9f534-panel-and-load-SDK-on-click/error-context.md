# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public\js\checkout.spec.js >> PayPal Checkout UI Verification >> should trigger PayPal panel and load SDK on click
- Location: public\js\checkout.spec.js:9:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 120000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: No Limits Beyond Limitations
      - heading "Born From Memory. Forged in the Stars. Beyond Every Limit." [level=1] [ref=e6]:
        - text: Born From Memory.
        - text: Forged in the Stars.
        - text: Beyond Every Limit.
      - paragraph [ref=e7]: "A cosmic collection crafted from grief, grit, and galaxies. Every piece carries a story, a spark, and a promise: there is no end to what we can become."
      - generic [ref=e8]:
        - button "Enter the Cosmic Vault" [ref=e9] [cursor=pointer]
        - 'button "Memorial Mode: Off" [ref=e10] [cursor=pointer]':
          - text: "Memorial Mode:"
          - generic [ref=e11]: "Off"
  - generic [ref=e13]:
    - generic [ref=e15]: Filter by Category
    - generic [ref=e16]:
      - generic [ref=e17]: Search
      - textbox "Search the cosmos…" [ref=e18]
  - main [ref=e19]
  - button "🛒 0" [ref=e20] [cursor=pointer]:
    - generic [ref=e21]: 🛒
    - generic [ref=e22]: "0"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('PayPal Checkout UI Verification', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Adjust URL to deployed site
  6  |     await page.goto('https://no-limits-beyond-limitations.vercel.app/shop.html');
  7  |   });
  8  | 
  9  |   test('should trigger PayPal panel and load SDK on click', async ({ page }) => {
  10 |     // Ensure shop shell is present (products may render asynchronously)
  11 |     await page.waitForSelector('#shop-grid, body');
  12 |     // Allow shop scripts to inject cards/buttons
  13 |     await page.waitForTimeout(500);
  14 |     // Prefer first PayPal button if products already injected
  15 |     await page.waitForSelector('.paypal-buy-now-btn', { timeout: 60000 }).catch(() => {});
> 16 |     await page.waitForTimeout(250);
     |                ^ Error: page.waitForTimeout: Test timeout of 120000ms exceeded.
  17 | 
  18 | 
  19 |     // Click the first PayPal button found
  20 |     const payBtn = page.locator('.paypal-buy-now-btn').first();
  21 |     await payBtn.click();
  22 | 
  23 |     // Verify the checkout panel is displayed
  24 |     const panel = page.locator('#paypal-checkout-panel');
  25 |     await expect(panel).toBeVisible();
  26 | 
  27 |     // Container exists; it may remain hidden until the SDK/button render completes.
  28 |     await expect(page.locator('#paypal-button-container')).toHaveCount(1);
  29 | 
  30 | 
  31 |   });
  32 | });
  33 | 
  34 | 
```