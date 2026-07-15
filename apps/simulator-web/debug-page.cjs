const { chromium } = require('playwright');

async function debugPage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Collect console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.log('Navigating to http://localhost:5176 ...');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  console.log('\n--- PAGE URL ---');
  console.log(page.url());

  console.log('\n--- PAGE TITLE ---');
  console.log(await page.title());

  console.log('\n--- BODY INNER HTML (first 3000 chars) ---');
  const bodyHtml = await page.evaluate(() => document.body.innerHTML.substring(0, 3000));
  console.log(bodyHtml);

  console.log('\n--- #app INNER HTML (first 2000 chars) ---');
  const appHtml = await page.evaluate(() => {
    const app = document.getElementById('app');
    return app ? app.innerHTML.substring(0, 2000) : '#app NOT FOUND';
  });
  console.log(appHtml);

  console.log('\n--- ALL ELEMENTS WITH CLASSES (first 50) ---');
  const elements = await page.evaluate(() => {
    const els = document.querySelectorAll('[class]');
    return Array.from(els).slice(0, 50).map(el => ({
      tag: el.tagName.toLowerCase(),
      class: el.className,
      text: el.textContent.substring(0, 100)
    }));
  });
  elements.forEach(el => console.log(`  <${el.tag} class="${el.class}"> ${el.text.substring(0, 80)}`));

  console.log('\n--- CONSOLE LOGS ---');
  consoleLogs.forEach(log => console.log(`  [${log.type}] ${log.text.substring(0, 200)}`));

  console.log('\n--- PAGE ERRORS ---');
  pageErrors.forEach(err => console.log('  ERROR: ' + err.substring(0, 300)));

  console.log('\n--- CSS VARIABLES CHECK ---');
  const cssVars = await page.evaluate(() => {
    const root = document.documentElement;
    const cs = window.getComputedStyle(root);
    return {
      '--color-primary': cs.getPropertyValue('--color-primary').trim(),
      '--color-bg-page': cs.getPropertyValue('--color-bg-page').trim(),
      '--color-bg-card': cs.getPropertyValue('--color-bg-card').trim(),
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      htmlBg: window.getComputedStyle(document.documentElement).backgroundColor,
    };
  });
  console.log(JSON.stringify(cssVars, null, 2));

  // Check all stylesheets
  console.log('\n--- STYLESHEETS ---');
  const stylesheets = await page.evaluate(() => {
    return Array.from(document.styleSheets).map(s => ({
      href: s.href,
      rules: s.cssRules ? s.cssRules.length : 'N/A (CORS?)'
    }));
  });
  stylesheets.forEach(s => console.log('  ' + s.href + ' rules:' + s.rules));

  // Check for link/style elements
  console.log('\n--- LINK/STYLE ELEMENTS ---');
  const linkStyles = await page.evaluate(() => {
    const links = document.querySelectorAll('link[rel="stylesheet"], style');
    return Array.from(links).map(el => el.outerHTML.substring(0, 200));
  });
  linkStyles.forEach(h => console.log('  ' + h));

  await browser.close();
}

debugPage().catch(console.error);
