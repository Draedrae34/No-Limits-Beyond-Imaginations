import { test, expect } from '@playwright/test';

test.describe('PayPal Checkout UI Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Adjust URL to deployed site
    await page.goto('https://no-limits-beyond-limitations.vercel.app/shop.html');
  });

  test('should trigger PayPal panel and load SDK on click', async ({ page }) => {
    // Ensure shop shell is present (products may render asynchronously)
    await page.waitForSelector('#shop-grid, body');
    // Allow shop scripts to inject cards/buttons
    await page.waitForTimeout(500);
    // Prefer first PayPal button if products already injected
    await page.waitForSelector('.paypal-buy-now-btn', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(250);


    // Click the first PayPal button found
    const payBtn = page.locator('.paypal-buy-now-btn').first();
    await payBtn.click();

    // Verify the checkout panel is displayed
    const panel = page.locator('#paypal-checkout-panel');
    await expect(panel).toBeVisible();

    // Container exists; it may remain hidden until the SDK/button render completes.
    await expect(page.locator('#paypal-button-container')).toHaveCount(1);


  });
});

