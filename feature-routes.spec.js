import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const BASE_URL = process.env.WORKSHOP_URL || 'https://no-limits-beyond-limitations.vercel.app';

const mockOrder = {
  id: 9001,
  paypal_order_id: 'PAYPAL-MOCK-9001',
  product_id: 'mock-hoodie',
  amount: 64.99,
  buyer_name: 'Aundrae Test',
  buyer_email: 'aundrae@example.com',
  fulfillment_status: 'pending',
  fulfillment_notes: 'Pack with care.',
  created_at: '2026-06-22T18:00:00.000Z',
  fulfilled_at: null,
};

const mockMessage = {
  id: 77,
  name: 'Legacy Friend',
  message: 'Sending love through the stars.',
  approved: false,
  hidden: false,
  admin_notes: '',
  created_at: '2026-06-22T18:05:00.000Z',
};

const mockGalleryItem = {
  id: 12,
  image_url: '/placeholder-product.png',
  original_name: 'Mock remembrance image',
  category: 'tribute',
  uploaded_at: '2026-06-22T18:10:00.000Z',
};

const mockProduct = {
  id: 201,
  name: 'Mock Cosmic Hoodie',
  description: 'A deterministic workshop product.',
  price: 49.99,
  category: 'Hoodie',
  active: true,
  image_url: '/placeholder-product.png',
};

test.describe('Feature route smoke checks', () => {
  async function grantWorkshopAccess(page) {
    await page.context().addCookies([{
      name: 'nlbl_auth',
      value: 'authenticated',
      domain: new URL(BASE_URL).hostname,
      path: '/',
      httpOnly: false,
      secure: BASE_URL.startsWith('https://'),
    }]);
  }

  async function mockWorkshopApis(page, calls = []) {
    await page.route('**/api/auth**', async (route) => {
      calls.push({ endpoint: 'auth', method: route.request().method() });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true, success: true }),
      });
    });

    await page.route('**/api/orders**', async (route) => {
      calls.push({ endpoint: 'orders', method: route.request().method() });
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, order: { ...mockOrder, fulfillment_status: 'fulfilled' } }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, orders: [mockOrder] }),
      });
    });

    await page.route('**/api/messages**', async (route) => {
      calls.push({ endpoint: 'messages', method: route.request().method() });
      if (route.request().method() === 'PUT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: { ...mockMessage, approved: true } }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, messages: [mockMessage] }),
      });
    });

    await page.route('**/api/gallery**', async (route) => {
      calls.push({ endpoint: 'gallery', method: route.request().method() });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, items: [mockGalleryItem], gallery: [mockGalleryItem] }),
      });
    });

    await page.route('**/api/products/**', async (route) => {
      calls.push({ endpoint: 'product-detail', method: route.request().method() });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, product: mockProduct }),
      });
    });

    await page.route('**/api/products', async (route) => {
      calls.push({ endpoint: 'products', method: route.request().method() });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, products: [mockProduct] }),
      });
    });
  }

  test('shop exposes catalog controls and checkout entry points', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('#shop-grid')).toHaveCount(1);
    await expect(page.locator('#product-search')).toHaveCount(1);
    await expect(page.locator('#category-filters')).toHaveCount(1);
    await expect(page.locator('#paypal-checkout-panel')).toHaveCount(1);
    await expect(page.locator('.paypal-buy-now-btn').first()).toBeAttached({ timeout: 60000 });
  });

  test('message wall exposes tribute composer and rendering grid', async ({ page }) => {
    await page.goto(`${BASE_URL}/message-wall.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('#tribute-name')).toHaveCount(1);
    await expect(page.locator('#tribute-text')).toHaveCount(1);
    await expect(page.locator('#tribute-preview')).toHaveCount(1);
    await expect(page.locator('#submit-tribute')).toHaveCount(1);
    await expect(page.locator('#honor-grid')).toHaveCount(1);
  });

  test('monitor and status pages expose operational panels', async ({ page }) => {
    await page.goto(`${BASE_URL}/monitor.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('#agent-status')).toHaveCount(1);
    await expect(page.locator('#shop-status')).toHaveCount(1);
    await expect(page.locator('#messages-status')).toHaveCount(1);
    await expect(page.locator('#paypal-test-log')).toHaveCount(1);

    await page.goto(`${BASE_URL}/status.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });

    await expect(page.locator('#shop-status')).toHaveCount(1);
    await expect(page.locator('#paypal-status')).toHaveCount(1);
    await expect(page.locator('#printify-status')).toHaveCount(1);
    await expect(page.locator('#agent-status')).toHaveCount(1);
    await expect(page.locator('#orders-status')).toHaveCount(1);

    const statusSource = fs.readFileSync(new URL('./public/status.html', import.meta.url), 'utf8');
    expect(statusSource).toContain("method: 'POST'");
  });

  test('private workshop entry and portal overlay anchors are present', async ({ page }) => {
    await grantWorkshopAccess(page);
    await page.route('**/api/auth**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true, success: true }),
      });
    });

    await page.goto(`${BASE_URL}/private.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page).toHaveURL(/\/workshop\.html/);

    await page.goto(`${BASE_URL}/workshop.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.locator('#cosmic-intro')).toHaveCount(1);
    await expect(page.locator('#starfield')).toHaveCount(1);
    await expect(page.locator('.workshop-shell')).toHaveCount(1);
  });

  test('private workshop panels render backend data and save admin actions', async ({ page }) => {
    const calls = [];
    await grantWorkshopAccess(page);
    await mockWorkshopApis(page, calls);

    await page.goto(`${BASE_URL}/workshop.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.locator('#cosmic-intro')).toHaveClass(/hidden/, { timeout: 10000 });

    await expect(page.locator('#orders-status')).toHaveText(/Loaded 1 order/, { timeout: 30000 });
    await page.locator('.tab-btn[data-tab="orders"]').click();
    await expect(page.locator('#orders')).toHaveClass(/active/);
    await expect(page.locator('#orders-table tbody')).toContainText('mock-hoodie');
    await page.locator('.order-detail-btn').first().click();
    await expect(page.locator('#order-modal')).toHaveClass(/active/);
    await expect(page.locator('#order-modal-title')).toHaveText('Order #9001');
    await page.locator('#order-fulfillment-status').selectOption('fulfilled');
    await page.locator('#order-fulfillment-save').click();
    await expect.poll(() => calls.some((call) => call.endpoint === 'orders' && call.method === 'PUT')).toBe(true);

    await page.locator('.tab-btn[data-tab="messages"]').click();
    await expect(page.locator('#messages')).toHaveClass(/active/);
    await expect(page.locator('#messages-table tbody')).toContainText('Legacy Friend');
    await page.locator('#messages-table button[data-action="view"]').first().click();
    await expect(page.locator('#message-modal')).toHaveClass(/active/);
    await page.locator('#modal-message-approved').check();
    await page.locator('#modal-message-save').click();
    await expect.poll(() => calls.some((call) => call.endpoint === 'messages' && call.method === 'PUT')).toBe(true);

    await page.locator('.tab-btn[data-tab="gallery"]').click();
    await expect(page.locator('#gallery')).toHaveClass(/active/);
    await expect(page.locator('#gallery-items')).toContainText('Mock remembrance image');
    await expect(page.locator('#gallery-admin')).toContainText('tribute');

    await page.locator('.tab-btn[data-tab="products"]').click();
    await expect(page.locator('#products')).toHaveClass(/active/);
    await expect(page.locator('#products-table tbody')).toContainText('Mock Cosmic Hoodie');
    await page.locator('.prod-edit').first().click();
    await expect(page.locator('#prod-name')).toHaveValue('Mock Cosmic Hoodie');
    await expect(page.locator('#prod-status')).toContainText('Editing product #201');
  });
});
