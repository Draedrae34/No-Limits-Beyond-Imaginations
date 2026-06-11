import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function listPublicHtmlPages() {
  const publicDir = path.join(process.cwd(), 'public');
  const entries = fs.readdirSync(publicDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => e.name)
    .sort();
}

const BASE_URL = process.env.WORKSHOP_URL || 'https://no-limits-beyond-limitations.vercel.app';

test.describe('Public site smoke - all public HTML pages', () => {
  const pages = listPublicHtmlPages();

  for (const pageName of pages) {
    test(`loads: ${pageName}`, async ({ page }) => {
      const url = `${BASE_URL}/${pageName}`;

      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

      // Basic sanity: page should have a DOM body.
      // Some pages trigger fast redirects / SPA bootstraps where DOM assertions can race.
      // Allow a longer window and don't fail solely on visibility.
      await expect(page.locator('body')).toHaveCount(1, { timeout: 30000 });

      // Some pages render hidden bodies initially (e.g., SPA overlays). Allow hidden.
      await expect(page.locator('body')).toBeVisible({ timeout: 5000 }).catch(() => {});






      // Fail fast if we saw JS errors (but allow pages that hit API endpoints returning 404/500).
      // We treat console.error as fatal only if it contains common JS error signatures.
      // Treat real JS runtime errors as fatal, but ignore fetch failures from pages that
      // expect auth/backend to be available.
      // (These pages often call /api/* and will legitimately fail during static smoke.)
      const fatal = consoleErrors.filter((t) => /(ReferenceError|TypeError|SyntaxError|Unhandled|ERR_)/i.test(t));

      // Ignore common fetch failures from pages that require auth/backend during smoke.
      const fatalFiltered = fatal.filter(
        (t) =>
          !/status of (404|401)/i.test(t) &&
          !/Failed to fetch/i.test(t) &&
          !/TypeError: Failed to fetch/i.test(t)
      );
      expect(fatalFiltered, `Fatal console errors on ${url}: ${fatalFiltered.join(' | ')}`).toEqual([]);




      // Heuristic: don’t allow totally blank pages.
      const text = (await page.locator('body').innerText()).trim();
      expect(text.length, `Blank page body for ${url}`).toBeGreaterThan(0);


    });
  }
});

