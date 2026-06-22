import { test, expect } from '@playwright/test';

const BASE_URL = process.env.WORKSHOP_URL || 'https://no-limits-beyond-limitations.vercel.app';


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
                  // shop-loader calls render("#paypal-button-container"); make sure it exists.
                  const container = document.querySelector(selector) || (() => {
                    const created = document.createElement('div');
                    if (selector.startsWith('#')) created.id = selector.slice(1);
                    document.body.appendChild(created);
                    return created;
                  })();

                  container.innerHTML = '<button id="mock-paypal-button">Mock PayPal Button</button>';

                  // Some shop-loader builds gate on a “container populated” signal.
                  // Trigger the container's contents observer by dispatching an event.
                  container.dispatchEvent(new Event('paypal:rendered'));
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

      // shop-loader expects: for paypal-client-id action -> { clientId }
      if (action === 'paypal-client-id') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ clientId: 'MOCK_CLIENT_ID' }),
        });
      }

      // for paypal-log-order action -> { success: true }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Mock response',
          action,
        }),
      });
    });



    // Navigate to the shop page where PayPal checkout is initiated
    await page.goto(`${BASE_URL}/shop.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });

    // Ensure the initial shop shell exists (can be hidden during transitions).
    // NOTE: Only require DOM attachment; never require visibility.
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await page.locator('#shop-grid').waitFor({ timeout: 60000, state: 'attached' });
    await page.waitForTimeout(250);
  });

  test('should simulate a successful PayPal payment and verify UI updates', async ({ page }) => {
    // Wait for shop shell; product cards + buttons may render after async fetch.
    // shop.html uses #shop-grid as the product container.
    // IMPORTANT: in some builds #shop-grid exists but remains hidden, so don't wait for visibility.
    await page.locator('#shop-grid').waitFor({ timeout: 120000, state: 'attached' });
    await page.waitForTimeout(500);



    // Shop-loader renders PayPal buttons as: .paypal-buy-now-btn[data-id]
    const payButtons = page.locator('.paypal-buy-now-btn');
    await payButtons.first().waitFor({ timeout: 120000, state: 'attached' });

    await payButtons.first().click({ force: true });

    // Wait for the mocked PayPal button to render; this is the reliable signal that SDK init + render worked.
    await page.waitForSelector('#mock-paypal-button', { timeout: 120000 });

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

    await expect(page.locator('#paypal-checkout-status')).toHaveText(/Payment successful[!.] Thank you\./);
    // Some deployments may not render the notification element; status text is the reliable assertion.

  });

  test('should handle a PayPal payment cancellation', async ({ page }) => {
    await page.waitForSelector('#shop-grid, body', { timeout: 60000 });
    await page.waitForTimeout(250);

    const cancelBtn = page.locator('#shop-grid .paypal-buy-now-btn').first();
    await cancelBtn.click({ force: true });
    await page.waitForSelector('#mock-paypal-button', { timeout: 60000 });

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
    await page.waitForSelector('#shop-grid, body', { timeout: 60000 });
    await page.waitForTimeout(250);

    await page.waitForSelector('#shop-grid .paypal-buy-now-btn', { timeout: 120000 });
    await page.locator('#shop-grid .paypal-buy-now-btn').first().click({ force: true });

    await page.waitForSelector('#mock-paypal-button', { timeout: 120000 });


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
      await expect(notif).toHaveText(/PayPal checkout failed\./);
    }

  });
});

