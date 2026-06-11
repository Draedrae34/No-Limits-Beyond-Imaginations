const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  console.log('Starting workshop browser smoke test...');
  await page.goto('http://localhost:3000/workshop-login.html', { waitUntil: 'domcontentloaded' });

  const loginForm = await page.$('#login-form');
  if (!loginForm) throw new Error('Login form not found');

  await page.fill('#password', process.env.WORKSHOP_PASSWORD || process.env.WORKSHOP_TEST_PASSWORD || 'testsecret');
  await Promise.all([
    page.waitForURL('**/workshop.html', { timeout: 60000 }).catch(() => null),
    page.waitForSelector('#mystic-chat-input, #lil-mystic-container', { timeout: 60000 }).catch(() => null),
    page.click('#login-form button[type=submit]'),
  ]);

  // At this point the redirect may have happened, or the workshop page may have loaded
  // without a URL change (depending on server/browser behavior).
  if (!page.url().includes('workshop.html')) {
    await page.goto('http://localhost:3000/workshop.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  console.log('Navigated to workshop:', page.url());


  await page.click('.tab-btn[data-tab="mystic"]');
  await page.waitForSelector('#mystic-chat-input', { timeout: 30000 });

  const consoleEntries = [];
  page.on('console', msg => consoleEntries.push({ type: msg.type(), text: msg.text() }));

  console.log('Waiting for local AI readiness or fallback status...');
  await page.waitForFunction(() => {
    return window.nlblAI && (window.nlblAI.isReady || window.nlblAI.failed);
  }, { timeout: 90000 });

  const readiness = await page.evaluate(() => ({ isReady: window.nlblAI?.isReady, failed: window.nlblAI?.failed }));
  console.log('AI readiness:', JSON.stringify(readiness));

  await page.fill('#mystic-chat-input', 'Generate a beat idea');
  await page.click('#mystic-chat-send');

  try {
    await page.waitForFunction(() => {
      const messages = Array.from(document.querySelectorAll('#mystic-chat-log .mystic-message'));
      return messages.some((msg) => msg.textContent.includes('Lil Mystic:'));
    }, { timeout: 90000 });
  } catch (err) {
    const messages = await page.$$eval('#mystic-chat-log .mystic-message', nodes => nodes.map(n => n.textContent.trim()));
    console.error('Timeout waiting for Lil Mystic reply. Current messages:', JSON.stringify(messages, null, 2));
    console.error('Browser console:', JSON.stringify(consoleEntries, null, 2));
    throw err;
  }

  const messages = await page.$$eval('#mystic-chat-log .mystic-message', nodes => nodes.map(n => n.textContent.trim()));
  console.log('Chat messages:', JSON.stringify(messages, null, 2));

  await browser.close();
  console.log('Workshop smoke test succeeded');
  process.exit(0);
})().catch((err) => {
  console.error('Smoke test failed:', err.message || err);
  process.exit(1);
});
