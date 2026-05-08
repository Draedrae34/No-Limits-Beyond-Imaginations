# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: paypal-mock.spec.js >> PayPal Checkout Simulation >> should simulate a successful PayPal payment and verify UI updates
- Location: paypal-mock.spec.js:84:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.product-card') to be visible

```

# Page snapshot

```yaml
- main [ref=e3]:
  - paragraph [ref=e4]:
    - generic [ref=e5]:
      - strong [ref=e6]: "404"
      - text: ": NOT_FOUND"
    - generic [ref=e7]:
      - text: "Code:"
      - code [ref=e8]: "`DEPLOYMENT_NOT_FOUND`"
    - generic [ref=e9]:
      - text: "ID:"
      - code [ref=e10]: "`sfo1::jbq64-1778211837996-ecc5f27559e0`"
  - link "This deployment cannot be found. For more information and troubleshooting, see our documentation." [ref=e11] [cursor=pointer]:
    - /url: https://vercel.com/docs/errors/DEPLOYMENT_NOT_FOUND
    - generic [ref=e12]: This deployment cannot be found. For more information and troubleshooting, see our documentation.
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
  42  |               id: "mock-p1",
  43  |               title: "Mock Cosmic Hoodie",
  44  |               description: "A test product from the void.",
  45  |               price: 49.99,
  46  |               images: [{ src: "/placeholder-product.png" }],
  47  |               variants: [{ price: 4999 }],
  48  |               active: true,
  49  |               category: "Hoodie"
  50  |             }
  51  |           ]
  52  |         }),
  53  |       });
  54  |     });
  55  | 
  56  |     // 3. Mock the /api/payments endpoint for both client ID retrieval and order logging
  57  |     await page.route('/api/payments', async route => {
  58  |       const requestBody = route.request().postDataJSON();
  59  |       if (requestBody.action === 'paypal-client-id') {
  60  |         // Respond with a mock client ID so the SDK loading logic completes
  61  |         await route.fulfill({
  62  |           status: 200,
  63  |           contentType: 'application/json',
  64  |           body: JSON.stringify({ clientId: 'MOCK_CLIENT_ID' }),
  65  |         });
  66  |       } else if (requestBody.action === 'paypal-log-order') {
  67  |         // Intercept and acknowledge the order logging API call
  68  |         console.log('Intercepted paypal-log-order API call:', requestBody);
  69  |         await route.fulfill({
  70  |           status: 200,
  71  |           contentType: 'application/json',
  72  |           body: JSON.stringify({ success: true, message: 'Mock order logged successfully' }),
  73  |         });
  74  |       } else {
  75  |         // Allow other /api/payments actions to proceed normally or be mocked separately
  76  |         await route.continue();
  77  |       }
  78  |     });
  79  | 
  80  |     // Navigate to the shop page where PayPal checkout is initiated
  81  |     await page.goto('https://silent-spirits-legacy.vercel.app/shop.html');
  82  |   });
  83  | 
  84  |   test('should simulate a successful PayPal payment and verify UI updates', async ({ page }) => {
  85  |     // Ensure products are rendered before interacting
> 86  |     await page.waitForSelector('.product-card');
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  87  | 
  88  |     // Click the first PayPal button to open the checkout panel and trigger SDK loading
  89  |     const payBtn = page.locator('.paypal-buy-now-btn').first();
  90  |     await payBtn.click();
  91  | 
  92  |     // Verify the PayPal checkout panel is displayed
  93  |     const panel = page.locator('#paypal-checkout-panel');
  94  |     await expect(panel).toBeVisible();
  95  | 
  96  |     // Wait for our mock PayPal button to be rendered by the injected script
  97  |     await page.waitForSelector('#mock-paypal-button');
  98  | 
  99  |     // Execute the captured onApprove callback directly in the browser context
  100 |     // This simulates the PayPal pop-up closing with a successful payment.
  101 |     const success = await page.evaluate(async () => {
  102 |       if (window._mockPaypalOnApprove) {
  103 |         // Provide mock data and actions that the onApprove callback expects
  104 |         const mockData = { orderID: 'MOCK_PAYPAL_ORDER_ID_123', payerID: 'MOCK_PAYER_ID' };
  105 |         const mockActions = { order: { capture: async () => ({ id: 'MOCK_PAYPAL_ORDER_ID_123', status: 'COMPLETED' }) } };
  106 |         await window._mockPaypalOnApprove(mockData, mockActions);
  107 |         return true;
  108 |       }
  109 |       console.error('window._mockPaypalOnApprove was not captured.');
  110 |       return false;
  111 |     });
  112 | 
  113 |     // Assert that the onApprove callback was successfully triggered
  114 |     expect(success).toBe(true);
  115 | 
  116 |     // Verify UI updates after the successful payment simulation
  117 |     await expect(page.locator('#paypal-checkout-status')).toHaveText('Payment successful! Thank you.');
  118 |     await expect(page.locator('.notification')).toBeVisible();
  119 |     await expect(page.locator('.notification')).toHaveText(/PayPal payment completed/);
  120 | 
  121 |     // You can add more assertions here, e.g., to check if the panel closes
  122 |     // if your application logic dictates it should.
  123 |   });
  124 | 
  125 |   test('should handle a PayPal payment cancellation', async ({ page }) => {
  126 |     await page.waitForSelector('.product-card');
  127 |     await page.locator('.paypal-buy-now-btn').first().click();
  128 |     await page.waitForSelector('#mock-paypal-button');
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
  139 |     await expect(page.locator('#paypal-checkout-status')).toHaveText('Payment cancelled. You can try again anytime.');
  140 |   });
  141 | 
  142 |   test('should handle a PayPal SDK error', async ({ page }) => {
  143 |     await page.waitForSelector('.product-card');
  144 |     await page.locator('.paypal-buy-now-btn').first().click();
  145 |     await page.waitForSelector('#mock-paypal-button');
  146 | 
  147 |     const success = await page.evaluate(async () => {
  148 |       if (window._mockPaypalOnError) {
  149 |         await window._mockPaypalOnError(new Error('Mock SDK Error'));
  150 |         return true;
  151 |       }
  152 |       return false;
  153 |     });
  154 | 
  155 |     expect(success).toBe(true);
  156 |     // Verify the status message defined in shop-loader.js onError
  157 |     await expect(page.locator('#paypal-checkout-status')).toHaveText('PayPal checkout failed. Please try again later.');
  158 |     
  159 |     // Check for error notification
  160 |     await expect(page.locator('.error-notification')).toBeVisible();
  161 |     await expect(page.locator('.error-notification')).toHaveText(/Unable to load PayPal checkout/);
  162 |   });
  163 | });
```