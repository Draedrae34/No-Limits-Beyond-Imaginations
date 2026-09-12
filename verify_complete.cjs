const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--enable-unsafe-swiftshader', '--use-gl=swiftshader']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.type(), msg.text().slice(0, 120));
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message.slice(0, 200));
  });
  
  await page.goto('http://127.0.0.1:8888/src/web/player.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  console.log('=== INITIAL STATE ===');
  console.log('Discovery visible:', !await page.$eval('#discoveryLaunchOverlay', el => el.classList.contains('hidden')));
  console.log('Chakra portals:', await page.$$eval('.chakra-portal', els => els.length));
  console.log('Buttons:', {
    enterTemple: !!await page.$('#launchEnterTemple'),
    journey: !!await page.$('#beginJourneyBtn'),
    sunrise: !!await page.$('#sunrisePsalmBtn'),
    hebrew: !!await page.$('#hebrewPrayerBtn'),
    fullscreen: !!await page.$('#fullscreenBtn')
  });
  
  // Enter temple
  await page.click('#launchEnterTemple');
  await page.waitForTimeout(3000);
  
  console.log('\n=== AFTER ENTERING ===');
  console.log('Chakra hub visible:', await page.$eval('#chakraHub', el => getComputedStyle(el).display));
  
  // Click journey button
  await page.click('#beginJourneyBtn');
  await page.waitForTimeout(4000);
  console.log('Status:', await page.$eval('#statusBar', el => el.textContent));
  console.log('Chakra space active:', await page.$eval('#chakraSpace', el => el.classList.contains('active')));
  
  await page.screenshot({ path: 'D:\\Projects\\Silent-Spirits-Legacy\\godtier_view.png' });
  console.log('Screenshot saved: godtier_view.png');
  
  await browser.close();
})();
