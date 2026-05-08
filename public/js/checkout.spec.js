import { test, expect } from '@playwright/test';

test.describe('PayPal Checkout UI Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Adjust URL to deployed site
    await page.goto('https://silent-spirits-legacy.vercel.app/shop.html');
  });

  test('should trigger PayPal panel and load SDK on click', async ({ page }) => {
    // Ensure products are rendered
    await page.waitForSelector('.product-card');

    // Click the first PayPal button found
    const payBtn = page.locator('.paypal-buy-now-btn').first();
    await payBtn.click();

    // Verify the checkout panel is displayed
    const panel = page.locator('#paypal-checkout-panel');
    await expect(panel).toBeVisible();

    // Check if the PayPal SDK script was injected into the head
    const sdkInjected = await page.evaluate(() => !!document.querySelector('script[src*="paypal.com/sdk/js"]'));
    expect(sdkInjected).toBe(true);
  });
});