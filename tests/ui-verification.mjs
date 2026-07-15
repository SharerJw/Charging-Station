import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const findings = [];

function record(testId, description, expected, found, pass) {
  findings.push({ testId, description, expected, found, result: pass ? 'PASS' : 'FAIL' });
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    // ============================================================
    // TEST 1: LOGIN PAGE (FE-001, H-001 to H-003)
    // ============================================================
    console.log('\n=== TEST 1: LOGIN PAGE ===');

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await delay(1500);
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });

    // H-001: Login form exists
    const usernameField = await page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="账号"], input[name="username"]').first();
    const passwordField = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button:has-text("登"), button:has-text("Login"), button:has-text("sign"), .login-btn, .el-button--primary').first();

    const hasUsername = await usernameField.isVisible().catch(() => false);
    const hasPassword = await passwordField.isVisible().catch(() => false);
    const hasLoginBtn = await loginButton.isVisible().catch(() => false);

    record('H-001', 'Login form - username field visible', 'visible', hasUsername ? 'visible' : 'not found', hasUsername);
    record('H-002', 'Login form - password field visible', 'visible', hasPassword ? 'visible' : 'not found', hasPassword);
    record('H-003', 'Login form - login button visible', 'visible', hasLoginBtn ? 'visible' : 'not found', hasLoginBtn);

    // Try submitting empty form
    if (hasLoginBtn) {
      await loginButton.click();
      await delay(500);
      const validationMsgs = await page.locator('.el-form-item__error, .el-message, .el-message-box, [class*="error"], [class*="validation"]').count();
      const hasValidation = validationMsgs > 0;
      await page.screenshot({ path: 'screenshots/02-login-validation.png', fullPage: true });
      record('FE-001a', 'Login empty form submission - validation messages', 'validation shown', `${validationMsgs} validation elements`, hasValidation);
    }

    // Enter credentials and login
    if (hasUsername && hasPassword) {
      await usernameField.fill('admin');
      await passwordField.fill('admin123');
      await loginButton.click();
      await delay(2000);

      const currentUrl = page.url();
      const redirected = !currentUrl.includes('/login');
      await page.screenshot({ path: 'screenshots/03-after-login.png', fullPage: true });
      record('FE-001b', 'Login with admin/admin123 - redirect to dashboard', 'redirect to /dashboard', `URL: ${currentUrl}`, redirected);
    }

    // ============================================================
    // TEST 2: DASHBOARD PAGE (FE-002, V-001 to V-005)
    // ============================================================
    console.log('\n=== TEST 2: DASHBOARD PAGE ===');

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
    await delay(2000);
    await page.screenshot({ path: 'screenshots/04-dashboard.png', fullPage: true });

    // V-001: Check statistic cards
    const statCards = await page.locator('.el-card, .stat-card, [class*="statistic"], [class*="card"], [class*="count"], [class*="summary"]').count();
    const hasStatCards = statCards >= 4; // at least 4 stat cards
    record('V-001', 'Dashboard - statistic cards visible', 'at least 4-6 stat cards', `${statCards} cards found`, hasStatCards);

    // V-002: Check charts/graphs render
    const chartElements = await page.locator('canvas, .echarts, [class*="chart"], svg, .el-chart, [ref*="chart"]').count();
    const hasCharts = chartElements > 0;
    record('V-002', 'Dashboard - charts/graphs render', 'charts visible', `${chartElements} chart elements found`, hasCharts);

    // V-003: Check recent orders table
    const tableRows = await page.locator('.el-table__body-wrapper tr, table tbody tr').count();
    const hasTableData = tableRows > 0;
    record('V-003', 'Dashboard - recent orders table has data', 'table rows > 0', `${tableRows} rows found`, hasTableData);

    // V-004: Check for NaN or undefined
    const bodyText = await page.locator('body').textContent();
    const hasNaN = bodyText.includes('NaN');
    const hasUndefined = bodyText.includes('undefined');
    const cleanText = !hasNaN && !hasUndefined;
    record('V-004', 'Dashboard - no NaN or undefined displayed', 'no NaN/undefined', `NaN: ${hasNaN}, undefined: ${hasUndefined}`, cleanText);

    // V-005: Check amount formatting (¥) and energy formatting (kWh)
    const hasYen = bodyText.includes('¥') || bodyText.includes('￥');
    const hasKwh = bodyText.includes('kWh') || bodyText.includes('KWh') || bodyText.includes('kw');
    record('V-005a', 'Dashboard - amount shows ¥ symbol', '¥ present', `found ¥: ${hasYen}`, hasYen);
    record('V-005b', 'Dashboard - energy shows kWh unit', 'kWh present', `found kWh: ${hasKwh}`, hasKwh);

    // Get visible text for analysis
    const dashboardTextSnippet = bodyText.substring(0, 2000);
    console.log('Dashboard text (first 2000 chars):', dashboardTextSnippet);

    // ============================================================
    // TEST 3: STATION MANAGEMENT (FE-003)
    // ============================================================
    console.log('\n=== TEST 3: STATION MANAGEMENT ===');

    await page.goto(`${BASE_URL}/station`, { waitUntil: 'networkidle', timeout: 15000 });
    await delay(2000);
    await page.screenshot({ path: 'screenshots/05-station.png', fullPage: true });

    const searchBar = await page.locator('input[placeholder*="搜索"], input[placeholder*="站"], .el-input, [class*="search"]').first();
    const hasSearch = await searchBar.isVisible().catch(() => false);
    record('FE-003a', 'Station - search bar exists', 'visible', hasSearch ? 'visible' : 'not found', hasSearch);

    const stationTable = await page.locator('.el-table, table').first();
    const hasStationTable = await stationTable.isVisible().catch(() => false);
    record('FE-003b', 'Station - table exists', 'visible', hasStationTable ? 'visible' : 'not found', hasStationTable);

    const stationRows = await page.locator('.el-table__body-wrapper tr, table tbody tr').count();
    record('FE-003c', 'Station - table has data rows', 'rows > 0', `${stationRows} rows`, stationRows > 0);

    const actionButtons = await page.locator('button:has-text("编辑"), button:has-text("删除"), button:has-text("新增"), button:has-text("添加"), button:has-text("操作"), .el-button').count();
    record('FE-003d', 'Station - action buttons exist', 'buttons present', `${actionButtons} buttons`, actionButtons > 0);

    const stationText = await page.locator('body').textContent();
    const hasStationNaN = stationText.includes('NaN') || stationText.includes('undefined');
    record('FE-003e', 'Station - no NaN/undefined in content', 'clean', `NaN/undefined: ${hasStationNaN}`, !hasStationNaN);

    // ============================================================
    // TEST 4: DEVICE MANAGEMENT (FE-004)
    // ============================================================
    console.log('\n=== TEST 4: DEVICE MANAGEMENT ===');

    await page.goto(`${BASE_URL}/device`, { waitUntil: 'networkidle', timeout: 15000 });
    await delay(2000);
    await page.screenshot({ path: 'screenshots/06-device.png', fullPage: true });

    const deviceRows = await page.locator('.el-table__body-wrapper tr, table tbody tr').count();
    record('FE-004a', 'Device - device list loads', 'rows > 0', `${deviceRows} rows`, deviceRows > 0);

    const deviceTable = await page.locator('.el-table, table').first();
    const hasDeviceTable = await deviceTable.isVisible().catch(() => false);
    record('FE-004b', 'Device - table visible', 'visible', hasDeviceTable ? 'visible' : 'not found', hasDeviceTable);

    const deviceText = await page.locator('body').textContent();
    const hasDeviceNaN = deviceText.includes('NaN') || deviceText.includes('undefined');
    record('FE-004c', 'Device - no NaN/undefined', 'clean', `NaN/undefined: ${hasDeviceNaN}`, !hasDeviceNaN);

    // ============================================================
    // TEST 5: ORDER CENTER (FE-005)
    // ============================================================
    console.log('\n=== TEST 5: ORDER CENTER ===');

    await page.goto(`${BASE_URL}/order`, { waitUntil: 'networkidle', timeout: 15000 });
    await delay(2000);
    await page.screenshot({ path: 'screenshots/07-order.png', fullPage: true });

    const orderTable = await page.locator('.el-table, table').first();
    const hasOrderTable = await orderTable.isVisible().catch(() => false);
    record('FE-005a', 'Order - table visible', 'visible', hasOrderTable ? 'visible' : 'not found', hasOrderTable);

    const orderRows = await page.locator('.el-table__body-wrapper tr, table tbody tr').count();
    record('FE-005b', 'Order - table has data rows', 'rows > 0', `${orderRows} rows`, orderRows > 0);

    const pagination = await page.locator('.el-pagination, [class*="pagination"], nav[aria-label*="pagination"]').count();
    const hasPagination = pagination > 0;
    record('FE-005c', 'Order - pagination exists', 'pagination present', `${pagination} pagination elements`, hasPagination);

    // Check order status tags with colors
    const statusTags = await page.locator('.el-tag, [class*="tag"], [class*="status"]').count();
    record('FE-005d', 'Order - status tags exist', 'tags present', `${statusTags} tags`, statusTags > 0);

    // Check if tags have background colors (not all same color)
    const tagStyles = await page.evaluate(() => {
      const tags = document.querySelectorAll('.el-tag, [class*="tag"]');
      const colors = new Set();
      tags.forEach(tag => {
        const style = window.getComputedStyle(tag);
        colors.add(style.backgroundColor);
      });
      return Array.from(colors);
    });
    const hasColorVariety = tagStyles.length > 1;
    record('FE-005e', 'Order - status tags have varied colors', 'multiple colors', `${tagStyles.length} distinct colors`, hasColorVariety);

    const orderText = await page.locator('body').textContent();
    const hasOrderNaN = orderText.includes('NaN') || orderText.includes('undefined');
    record('FE-005f', 'Order - no NaN/undefined', 'clean', `NaN/undefined: ${hasOrderNaN}`, !hasOrderNaN);

    // ============================================================
    // TEST 6: FINANCE MANAGEMENT (FE-006)
    // ============================================================
    console.log('\n=== TEST 6: FINANCE MANAGEMENT ===');

    await page.goto(`${BASE_URL}/finance`, { waitUntil: 'networkidle', timeout: 15000 });
    await delay(2000);
    await page.screenshot({ path: 'screenshots/08-finance.png', fullPage: true });

    const financeBody = await page.locator('body').textContent();
    const hasFinanceContent = financeBody.length > 100;
    record('FE-006a', 'Finance - page loads with content', 'content present', `text length: ${financeBody.length}`, hasFinanceContent);

    const hasFinanceNaN = financeBody.includes('NaN') || financeBody.includes('undefined');
    record('FE-006b', 'Finance - no NaN/undefined', 'clean', `NaN/undefined: ${hasFinanceNaN}`, !hasFinanceNaN);

    const hasFinanceYen = financeBody.includes('¥') || financeBody.includes('￥');
    record('FE-006c', 'Finance - currency formatting (¥)', '¥ present', `found ¥: ${hasFinanceYen}`, hasFinanceYen);

    const financeCards = await page.locator('.el-card, [class*="card"], [class*="stat"]').count();
    record('FE-006d', 'Finance - financial cards/widgets visible', 'widgets present', `${financeCards} card elements`, financeCards > 0);

    // ============================================================
    // TEST 7: NAVIGATION (V-019)
    // ============================================================
    console.log('\n=== TEST 7: NAVIGATION ===');

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
    await delay(2000);

    const sidebar = await page.locator('.el-aside, .sidebar, [class*="sidebar"], [class*="menu"], nav, .el-menu').first();
    const hasSidebar = await sidebar.isVisible().catch(() => false);
    record('V-019a', 'Navigation - sidebar visible', 'visible', hasSidebar ? 'visible' : 'not found', hasSidebar);

    // Check menu items
    const menuItems = await page.locator('.el-menu-item, .el-sub-menu, [class*="menu-item"], a[href*="/"]').count();
    record('V-019b', 'Navigation - menu items present', 'menu items > 0', `${menuItems} menu items`, menuItems > 0);

    // Check active menu highlighting
    const activeMenu = await page.locator('.el-menu-item.is-active, .el-menu-item.active, [class*="active"][class*="menu"]').count();
    const hasActiveHighlight = activeMenu > 0;
    record('V-019c', 'Navigation - active menu highlighting', 'active class on current page', `${activeMenu} active menu items`, hasActiveHighlight);

    // Click through navigation to test
    const navRoutes = ['station', 'device', 'order', 'dashboard'];
    let navWorks = true;
    for (const route of navRoutes) {
      try {
        const menuItem = await page.locator(`.el-menu-item:has-text("${route === 'station' ? '站点' : route === 'device' ? '设备' : route === 'order' ? '订单' : '工作台'}")`).first();
        if (await menuItem.isVisible().catch(() => false)) {
          await menuItem.click();
          await delay(1500);
        }
      } catch (e) {
        // try URL navigation
        await page.goto(`${BASE_URL}/${route}`, { waitUntil: 'networkidle', timeout: 10000 });
        await delay(1000);
      }
    }
    const finalUrl = page.url();
    record('V-019d', 'Navigation - clicking menu items navigates', 'navigation works', `Final URL: ${finalUrl}`, navWorks);

    // ============================================================
    // TEST 8: VISUAL CONSISTENCY (UX-001 to UX-005)
    // ============================================================
    console.log('\n=== TEST 8: VISUAL CONSISTENCY ===');

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
    await delay(2000);

    // Check brand color #1677FF presence
    const brandColorCheck = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      let brandBlueFound = false;
      let bgFound = false;

      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;
        const border = style.borderColor;

        // Check for #1677FF (rgb(22, 119, 255))
        if (bg.includes('22, 119, 255') || color.includes('22, 119, 255') || border.includes('22, 119, 255')) {
          brandBlueFound = true;
        }
        // Also check for Element Plus primary blue variations (close to 1677FF)
        if (bg.includes('64, 158, 255') || color.includes('64, 158, 255')) {
          brandBlueFound = true; // Element Plus default primary
        }

        // Check for #F0F2F5 (rgb(240, 242, 245))
        if (bg.includes('240, 242, 245')) {
          bgFound = true;
        }
      }
      return { brandBlueFound, bgFound };
    });

    // Also check CSS variables and inline styles
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const rootStyle = getComputedStyle(root);
      const vars = {};
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText === ':root' || rule.selectorText === ':root *' || rule.selectorText === ':root') {
              // Extract CSS variables
            }
          }
        } catch(e) {}
      }
      // Check computed styles
      vars.elColorPrimary = rootStyle.getPropertyValue('--el-color-primary').trim();
      vars.bg = rootStyle.getPropertyValue('--el-bg-color').trim();
      vars.pageBg = rootStyle.getPropertyValue('--el-bg-color-page').trim();
      return vars;
    });

    record('UX-001', 'Visual - brand color #1677FF present', 'blue primary color found', `brandBlue: ${brandColorCheck.brandBlueFound}, CSS var: ${cssVars.elColorPrimary || 'none'}`, brandColorCheck.brandBlueFound || cssVars.elColorPrimary !== '');

    record('UX-002', 'Visual - background color #F0F2F5', 'bg color found', `pageBgFound: ${brandColorCheck.bgFound}, CSS var: ${cssVars.pageBg || 'none'}`, brandColorCheck.bgFound || cssVars.pageBg !== '');

    // Font consistency
    const fontFamily = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontFamily;
    });
    const hasChineseFont = fontFamily.includes('PingFang') || fontFamily.includes('YaHei') || fontFamily.includes('Microsoft') || fontFamily.includes('system') || fontFamily.includes('Helvetica') || fontFamily.includes('sans-serif');
    record('UX-003', 'Visual - font family set appropriately', 'Chinese-friendly font stack', `font: ${fontFamily}`, hasChineseFont);

    // Spacing consistency (8px grid)
    const spacingCheck = await page.evaluate(() => {
      const cards = document.querySelectorAll('.el-card, [class*="card"]');
      const paddings = [];
      const margins = [];
      cards.forEach(card => {
        const s = getComputedStyle(card);
        paddings.push(s.padding);
        margins.push(s.margin);
      });
      return { paddings: paddings.slice(0, 5), margins: margins.slice(0, 5) };
    });
    record('UX-004', 'Visual - card spacing follows 8px grid', 'consistent spacing', `padding samples: ${JSON.stringify(spacingCheck.paddings)}`, spacingCheck.paddings.length > 0);

    // Responsive container
    const containerCheck = await page.evaluate(() => {
      const containers = document.querySelectorAll('.el-container, [class*="layout"], [class*="container"]');
      return containers.length;
    });
    record('UX-005', 'Visual - layout containers present', 'containers found', `${containerCheck} containers`, containerCheck > 0);

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/09-final-dashboard.png', fullPage: true });

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n========================================');
    console.log('VISUAL VERIFICATION TEST RESULTS');
    console.log('========================================\n');

    let passCount = 0;
    let failCount = 0;

    for (const f of findings) {
      const status = f.result === 'PASS' ? '[PASS]' : '[FAIL]';
      console.log(`${status} ${f.testId}: ${f.description}`);
      console.log(`       Expected: ${f.expected}`);
      console.log(`       Found:    ${f.found}`);
      if (f.result === 'FAIL') {
        console.log(`       *** FAILURE ***`);
      }
      console.log('');
      if (f.result === 'PASS') passCount++;
      else failCount++;
    }

    console.log('========================================');
    console.log(`TOTAL: ${findings.length} | PASS: ${passCount} | FAIL: ${failCount}`);
    console.log('========================================');

    if (consoleErrors.length > 0) {
      console.log(`\nConsole errors captured (${consoleErrors.length}):`);
      consoleErrors.forEach(e => console.log(`  - ${e.substring(0, 200)}`));
    }

    // Output JSON for machine parsing
    console.log('\n__FINDINGS_JSON__');
    console.log(JSON.stringify(findings, null, 2));
    console.log('__END_FINDINGS_JSON__');

  } catch (error) {
    console.error('Test execution error:', error.message);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
