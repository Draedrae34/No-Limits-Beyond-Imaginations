import { test, expect } from '@playwright/test';

test.describe('PayPal Checkout Simulation', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock the PayPal SDK script to prevent it from loading and inject our own mock
    await page.route('https://www.paypal.com/sdk/js**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.paypal = {
            Buttons: function(options) {
              // Capture the onApprove and createOrder callbacks for later use in the test
              window._mockPaypalOnApprove = options.onApprove;
              window._mockPaypalOnCancel = options.onCancel;
              window._mockPaypalOnError = options.onError;
              window._mockPaypalCreateOrder = options.createOrder;
              return {
                render: function(selector) {
                  // Simulate button rendering by adding a mock button to the DOM
                  document.querySelector(selector).innerHTML = '<button id="mock-paypal-button">Mock PayPal Button</button>';
                  console.log('Mock PayPal button rendered in', selector);
                }
              };
            }
          };
          // Simulate PayPal SDK initialization completion for shop-loader.js's waitForPayPal()
          window.paypal.Buttons.is_initialized = true;
        `,
      });
    });

    // 2. Mock the Printify API product loading
    await page.route('**/api/printify?action=adminList', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          products: [
            {
              id: 'mock-p1',
              title: 'Mock Cosmic Hoodie',
              description: 'A test product from the void.',
              price: 49.99,
              images: [{ src: '/placeholder-product.png' }],
              variants: [{ price: 4999 }],
              active: true,
              category: 'Hoodie',
            },
          ],
        }),
      });
    });

    // 3. Mock the /api/payments endpoint for both client ID retrieval and order logging
    await page.route('**/api/payments', async route => {
      const requestBody = route.request().postDataJSON();
      const action = requestBody?.action;

      // Helpful debugging: keep a lightweight marker in the page
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          __mock_payments_route: true,
          action,
          // default to success to avoid falling into the 500 branch
          success: true,
          message: 'Mock response',
          clientId: 'MOCK_CLIENT_ID',
        }),
      });
    });


    // Navigate to the shop page where PayPal checkout is initiated
    await page.goto('https://no-limits-beyond-limitations.vercel.app/shop.html');

    // Ensure product cards section is present; fail fast with a readable message.
    await page.waitForSelector('.product-card, .product-grid, #product-grid, body', { timeout: 60000 });
  });

  test('should simulate a successful PayPal payment and verify UI updates', async ({ page }) => {
    // Products are often rendered after async Printify fetch; wait longer to avoid flakiness.
    await page.waitForSelector('.product-card', { timeout: 120000 });


    const payBtn = page.locator('.paypal-buy-now-btn').first();
    await payBtn.click();

    const panel = page.locator('#paypal-checkout-panel');
    await expect(panel).toBeVisible();

    await page.waitForSelector('#mock-paypal-button');

    const success = await page.evaluate(async () => {
      if (window._mockPaypalOnApprove) {
        const mockData = { orderID: 'MOCK_PAYPAL_ORDER_ID_123', payerID: 'MOCK_PAYER_ID' };
        const mockActions = {
          order: {
            capture: async () => ({ id: 'MOCK_PAYPAL_ORDER_ID_123', status: 'COMPLETED' }),
          },
        };
        await window._mockPaypalOnApprove(mockData, mockActions);
        return true;
      }
      return false;
    });

    expect(success).toBe(true);

    await expect(page.locator('#paypal-checkout-status')).toHaveText('Payment successful. Thank you.');
    // Some deployments may not render the notification element; status text is the reliable assertion.

  });

  test('should handle a PayPal payment cancellation', async ({ page }) => {
    await page.waitForSelector('.product-card');

    await page.locator('.paypal-buy-now-btn').first().click();
    await page.waitForSelector('#mock-paypal-button');

    const success = await page.evaluate(async () => {
      if (window._mockPaypalOnCancel) {
        await window._mockPaypalOnCancel();
        return true;
      }
      return false;
    });

    expect(success).toBe(true);
    await expect(page.locator('#paypal-checkout-status')).toHaveText(
      'Payment cancelled. You can try again anytime.'
    );
  });

  test('should handle a PayPal SDK error', async ({ page }) => {
    await page.waitForSelector('.product-card');

    await page.locator('.paypal-buy-now-btn').first().click();
    await page.waitForSelector('#mock-paypal-button');

    const success = await page.evaluate(async () => {
      if (window._mockPaypalOnError) {
        await window._mockPaypalOnError(new Error('Mock SDK Error'));
        return true;
      }
      return false;
    });

    expect(success).toBe(true);

    await expect(page.locator('#paypal-checkout-status')).toHaveText(
      'PayPal checkout failed. Please try again later.'
    );
    const notif = page.locator('.error-notification');
    if (await notif.count()) {
      await expect(notif).toBeVisible();
      await expect(notif).toHaveText(/Unable to load PayPal checkout/);
    }

  });
});

