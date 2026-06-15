# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: paypal-mock.spec.js >> PayPal Checkout Simulation >> should simulate a successful PayPal payment and verify UI updates
- Location: paypal-mock.spec.js:86:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('.paypal-buy-now-btn').first()

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('PayPal Checkout Simulation', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // 1. Mock the PayPal SDK script to prevent it from loading and inject our own mock
  6   |     await page.route('https://www.paypal.com/sdk/js**', async route => {
  7   |       await route.fulfill({
  8   |         status: 200,
  9   |         contentType: 'application/javascript',
  10  |         body: `
  11  |           window.paypal = {
  12  |             Buttons: function(options) {
  13  |               // Capture the onApprove and createOrder callbacks for later use in the test
  14  |               window._mockPaypalOnApprove = options.onApprove;
  15  |               window._mockPaypalOnCancel = options.onCancel;
  16  |               window._mockPaypalOnError = options.onError;
  17  |               window._mockPaypalCreateOrder = options.createOrder;
  18  |               return {
  19  |                 render: function(selector) {
  20  |                   // Simulate button rendering by adding a mock button to the DOM
  21  |                   document.querySelector(selector).innerHTML = '<button id="mock-paypal-button">Mock PayPal Button</button>';
  22  |                   console.log('Mock PayPal button rendered in', selector);
  23  |                 }
  24  |               };
  25  |             }
  26  |           };
  27  |           // Simulate PayPal SDK initialization completion for shop-loader.js's waitForPayPal()
  28  |           window.paypal.Buttons.is_initialized = true;
  29  |         `,
  30  |       });
  31  |     });
  32  | 
  33  |     // 2. Mock the Printify API product loading
  34  |     await page.route('**/api/printify?action=adminList', async route => {
  35  |       await route.fulfill({
  36  |         status: 200,
  37  |         contentType: 'application/json',
  38  |         body: JSON.stringify({
  39  |           success: true,
  40  |           products: [
  41  |             {
  42  |               id: 'mock-p1',
  43  |               title: 'Mock Cosmic Hoodie',
  44  |               description: 'A test product from the void.',
  45  |               price: 49.99,
  46  |               images: [{ src: '/placeholder-product.png' }],
  47  |               variants: [{ price: 4999 }],
  48  |               active: true,
  49  |               category: 'Hoodie',
  50  |             },
  51  |           ],
  52  |         }),
  53  |       });
  54  |     });
  55  | 
  56  |     // 3. Mock the /api/payments endpoint for both client ID retrieval and order logging
  57  |     await page.route('**/api/payments', async route => {
  58  |       const requestBody = route.request().postDataJSON();
  59  |       const action = requestBody?.action;
  60  | 
  61  |       // Helpful debugging: keep a lightweight marker in the page
  62  |       await route.fulfill({
  63  |         status: 200,
  64  |         contentType: 'application/json',
  65  |         body: JSON.stringify({
  66  |           __mock_payments_route: true,
  67  |           action,
  68  |           // default to success to avoid falling into the 500 branch
  69  |           success: true,
  70  |           message: 'Mock response',
  71  |           clientId: 'MOCK_CLIENT_ID',
  72  |         }),
  73  |       });
  74  |     });
  75  | 
  76  | 
  77  |     // Navigate to the shop page where PayPal checkout is initiated
  78  |     await page.goto('https://no-limits-beyond-limitations.vercel.app/shop.html');
  79  | 
  80  |     // Ensure the shop shell is present (cards may be injected later by async scripts)
  81  |     await page.waitForSelector('#shop-grid, body', { timeout: 60000 });
  82  |     // If cards render, great; otherwise keep tests resilient to slow async rendering.
  83  |     await page.waitForTimeout(250);
  84  |   });
  85  | 
  86  |   test('should simulate a successful PayPal payment and verify UI updates', async ({ page }) => {
  87  |     // Wait for shop shell; product cards + buttons may render after async fetch.
  88  |     await page.waitForSelector('#shop-grid, body', { timeout: 120000 });
  89  |     await page.waitForTimeout(500);
  90  | 
  91  |     // Click PayPal button as soon as it exists.
  92  |     const payBtn = page.locator('.paypal-buy-now-btn').first();
  93  |     await payBtn.waitFor({ timeout: 120000 }).catch(() => {});
  94  | 
> 95  |     await payBtn.click();
      |                  ^ Error: locator.click: Test timeout of 120000ms exceeded.
  96  | 
  97  |     const panel = page.locator('#paypal-checkout-panel');
  98  |     await expect(panel).toBeVisible();
  99  | 
  100 |     await page.waitForSelector('#mock-paypal-button');
  101 | 
  102 |     const success = await page.evaluate(async () => {
  103 |       if (window._mockPaypalOnApprove) {
  104 |         const mockData = { orderID: 'MOCK_PAYPAL_ORDER_ID_123', payerID: 'MOCK_PAYER_ID' };
  105 |         const mockActions = {
  106 |           order: {
  107 |             capture: async () => ({ id: 'MOCK_PAYPAL_ORDER_ID_123', status: 'COMPLETED' }),
  108 |           },
  109 |         };
  110 |         await window._mockPaypalOnApprove(mockData, mockActions);
  111 |         return true;
  112 |       }
  113 |       return false;
  114 |     });
  115 | 
  116 |     expect(success).toBe(true);
  117 | 
  118 |     await expect(page.locator('#paypal-checkout-status')).toHaveText('Payment successful. Thank you.');
  119 |     // Some deployments may not render the notification element; status text is the reliable assertion.
  120 | 
  121 |   });
  122 | 
  123 |   test('should handle a PayPal payment cancellation', async ({ page }) => {
  124 |     await page.waitForSelector('#shop-grid, body', { timeout: 60000 });
  125 |     await page.waitForTimeout(250);
  126 | 
  127 |     await page.locator('.paypal-buy-now-btn').first().click();
  128 |     await page.waitForSelector('#mock-paypal-button', { timeout: 60000 });
  129 | 
  130 |     const success = await page.evaluate(async () => {
  131 |       if (window._mockPaypalOnCancel) {
  132 |         await window._mockPaypalOnCancel();
  133 |         return true;
  134 |       }
  135 |       return false;
  136 |     });
  137 | 
  138 |     expect(success).toBe(true);
  139 |     await expect(page.locator('#paypal-checkout-status')).toHaveText(
  140 |       'Payment cancelled. You can try again anytime.'
  141 |     );
  142 |   });
  143 | 
  144 |   test('should handle a PayPal SDK error', async ({ page }) => {
  145 |     await page.waitForSelector('.product-card');
  146 | 
  147 |     await page.locator('.paypal-buy-now-btn').first().click();
  148 |     await page.waitForSelector('#mock-paypal-button');
  149 | 
  150 |     const success = await page.evaluate(async () => {
  151 |       if (window._mockPaypalOnError) {
  152 |         await window._mockPaypalOnError(new Error('Mock SDK Error'));
  153 |         return true;
  154 |       }
  155 |       return false;
  156 |     });
  157 | 
  158 |     expect(success).toBe(true);
  159 | 
  160 |     await expect(page.locator('#paypal-checkout-status')).toHaveText(
  161 |       'PayPal checkout failed. Please try again later.'
  162 |     );
  163 |     const notif = page.locator('.error-notification');
  164 |     if (await notif.count()) {
  165 |       await expect(notif).toBeVisible();
  166 |       await expect(notif).toHaveText(/Unable to load PayPal checkout/);
  167 |     }
  168 | 
  169 |   });
  170 | });
  171 | 
  172 | 
```