import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));

  await page.goto('http://localhost:5177', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'D:/Agent/claude/demo07/test-screenshots/debug-simulator.png', fullPage: true });

  // Check specific selectors
  const selectors = [
    '.el-container', '.sidebar', '.header', '.main-content',
    '.dashboard', '.device-card', '.stat-card', '.card',
    '.control-bar', '.stats-grid', '.charts-row',
    '.el-aside', '.el-main', '.el-header',
    '.device-section', '.events-section',
    'canvas', '.logo', '.logo-text',
    '#app'
  ];

  for (const sel of selectors) {
    const count = await page.locator(sel).count();
    console.log(`Selector "${sel}": ${count} elements`);
  }

  // Get body text
  const bodyText = await page.textContent('body');
  console.log('\nBody text (first 1000 chars):', bodyText?.substring(0, 1000));

  await browser.close();
})();
