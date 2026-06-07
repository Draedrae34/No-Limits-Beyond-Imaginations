import { test, expect } from '@playwright/test';

const BASE_URL = process.env.WORKSHOP_URL || 'http://localhost:3000';
const PASSWORD = process.env.WORKSHOP_PASSWORD || process.env.WORKSHOP_TEST_PASSWORD || 'testsecret';

test.describe('Private Workshop', () => {
  test('allows login and receives a Lil Mystic chat response', async ({ page }) => {
    await page.goto(`${BASE_URL}/workshop-login.html`, { waitUntil: 'domcontentloaded' });
    await page.fill('#password', PASSWORD);

    await Promise.all([
      page.waitForURL('**/workshop.html', { timeout: 30000 }),
      page.click('#login-form button[type=submit]'),
    ]);

    await page.click('.tab-btn[data-tab="mystic"]');
    await page.waitForSelector('#mystic-chat-input', { timeout: 30000 });

    await page.waitForFunction(() => window.nlblAI && (window.nlblAI.isReady || window.nlblAI.failed), {
      timeout: 90000,
    });

    await page.fill('#mystic-chat-input', 'Generate a beat idea');
    await page.click('#mystic-chat-send');

    await page.waitForFunction(() => {
      const messages = Array.from(document.querySelectorAll('#mystic-chat-log .mystic-message'));
      return messages.some((msg) => msg.textContent.includes('Lil Mystic:'));
    }, { timeout: 90000 });

    const messages = await page.$$eval('#mystic-chat-log .mystic-message', (nodes) =>
      nodes.map((node) => node.textContent.trim())
    );

    expect(messages.some((text) => text.startsWith('Lil Mystic:'))).toBe(true);
  });
});
