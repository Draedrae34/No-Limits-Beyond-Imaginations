export async function waitForAnySelector(page, selectors, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    for (const sel of selectors) {
      const loc = page.locator(sel).first();
      try {
        if (await loc.count()) return loc;
      } catch {}
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`Timed out waiting for any selector: ${selectors.join(', ')}`);
}

export async function mockPaypalRenderToContainer(page) {
  await page.waitForTimeout(10);
}

export async function clickPaypalCheckout(page) {
  // Ensure shop loader has had time to attach listeners / render cards
  const btn = page.locator('#shop-grid .paypal-buy-now-btn').first();
  await btn.click({ force: true }).catch(() => {});
  // If PayPal SDK/button container is not created yet, wait a bit for it.
  await page.waitForSelector('#paypal-checkout-panel', { timeout: 15000 }).catch(() => {});
}


