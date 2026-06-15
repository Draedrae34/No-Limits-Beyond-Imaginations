// Utility helpers for PayPal mock + deterministic UI for Playwright tests

export function waitForProductsOrBody(page, timeoutMs = 60000) {
  return page.waitForSelector('.product-card, .product-grid, #shop-grid, #product-grid, body', {
    timeout: timeoutMs,
  });
}

export function findPaypalButtonLabel(page) {
  return page.locator('.paypal-buy-now-btn, button[data-id]').first().innerText().catch(() => '');
}

