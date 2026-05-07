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
              id: "mock-p1",
              title: "Mock Cosmic Hoodie",
              description: "A test product from the void.",
              price: 49.99,
              images: [{ src: "/placeholder-product.png" }],
              variants: [{ price: 4999 }],
              active: true,
              category: "Hoodie"
            }
          ]
        }),
      });
    });

    // 3. Mock the /api/payments endpoint for both client ID retrieval and order logging
    await page.route('/api/payments', async route => {
      const requestBody = route.request().postDataJSON();
      if (requestBody.action === 'paypal-client-id') {
        // Respond with a mock client ID so the SDK loading logic completes
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ clientId: 'MOCK_CLIENT_ID' }),
        });
      } else if (requestBody.action === 'paypal-log-order') {
        // Intercept and acknowledge the order logging API call
        console.log('Intercepted paypal-log-order API call:', requestBody);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Mock order logged successfully' }),
        });
      } else {
        // Allow other /api/payments actions to proceed normally or be mocked separately
        await route.continue();
      }
    });

    // Navigate to the shop page where PayPal checkout is initiated
    await page.goto('http://localhost:3000/shop.html');
  });

  test('should simulate a successful PayPal payment and verify UI updates', async ({ page }) => {
    // Ensure products are rendered before interacting
    await page.waitForSelector('.product-card');

    // Click the first PayPal button to open the checkout panel and trigger SDK loading
    const payBtn = page.locator('.paypal-buy-now-btn').first();
    await payBtn.click();

    // Verify the PayPal checkout panel is displayed
    const panel = page.locator('#paypal-checkout-panel');
    await expect(panel).toBeVisible();

    // Wait for our mock PayPal button to be rendered by the injected script
    await page.waitForSelector('#mock-paypal-button');

    // Execute the captured onApprove callback directly in the browser context
    // This simulates the PayPal pop-up closing with a successful payment.
    const success = await page.evaluate(async () => {
      if (window._mockPaypalOnApprove) {
        // Provide mock data and actions that the onApprove callback expects
        const mockData = { orderID: 'MOCK_PAYPAL_ORDER_ID_123', payerID: 'MOCK_PAYER_ID' };
        const mockActions = { order: { capture: async () => ({ id: 'MOCK_PAYPAL_ORDER_ID_123', status: 'COMPLETED' }) } };
        await window._mockPaypalOnApprove(mockData, mockActions);
        return true;
      }
      console.error('window._mockPaypalOnApprove was not captured.');
      return false;
    });

    // Assert that the onApprove callback was successfully triggered
    expect(success).toBe(true);

    // Verify UI updates after the successful payment simulation
    await expect(page.locator('#paypal-checkout-status')).toHaveText('Payment successful! Thank you.');
    await expect(page.locator('.notification')).toBeVisible();
    await expect(page.locator('.notification')).toHaveText(/PayPal payment completed/);

    // You can add more assertions here, e.g., to check if the panel closes
    // if your application logic dictates it should.
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
    await expect(page.locator('#paypal-checkout-status')).toHaveText('Payment cancelled. You can try again anytime.');
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
    // Verify the status message defined in shop-loader.js onError
    await expect(page.locator('#paypal-checkout-status')).toHaveText('PayPal checkout failed. Please try again later.');
    
    // Check for error notification
    await expect(page.locator('.error-notification')).toBeVisible();
    await expect(page.locator('.error-notification')).toHaveText(/Unable to load PayPal checkout/);
  });
});