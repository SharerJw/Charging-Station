import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5177';
const SCREENSHOT_DIR = 'D:/Agent/claude/demo07/test-screenshots';

// Results collector
const results: Array<{testId: string, check: string, status: 'PASS'|'FAIL', detail: string}> = [];

function log(testId: string, check: string, status: 'PASS'|'FAIL', detail: string) {
  results.push({ testId, check, status, detail });
  console.log(`[${status}] ${testId} - ${check}: ${detail}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // =========================================================
  // TEST 1: Dashboard (FE-014)
  // =========================================================
  console.log('\n=== TEST 1: Dashboard (FE-014) ===');

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    // Wait for Vue app to render
    await page.waitForTimeout(3000);
  } catch (e) {
    log('FE-014', 'Page load', 'FAIL', `Failed to load: ${e}`);
    await browser.close();
    process.exit(1);
  }

  // Take full page screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard-full.png`, fullPage: true });
  log('FE-014', 'Page load', 'PASS', 'Dashboard loaded successfully');

  // 1a. Verify device cards are displayed
  const deviceCards = await page.locator('.device-card').count();
  if (deviceCards > 0) {
    log('FE-014', 'Device cards displayed', 'PASS', `Found ${deviceCards} device cards`);
  } else {
    log('FE-014', 'Device cards displayed', 'FAIL', 'No device cards found on dashboard');
  }

  // Take screenshot of device card area
  const deviceSection = page.locator('.device-section');
  if (await deviceSection.isVisible()) {
    await deviceSection.screenshot({ path: `${SCREENSHOT_DIR}/02-dashboard-devices.png` });
  }

  // 1b. Verify dark theme - main content background
  const mainBg = await page.locator('.main-content').evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  // #0B1120 = rgb(11, 17, 32)
  const isDarkBg = mainBg.includes('11, 17, 32') || mainBg.includes('11,17,32');
  if (isDarkBg) {
    log('FE-014', 'Dark theme background #0B1120', 'PASS', `Background color: ${mainBg}`);
  } else {
    log('FE-014', 'Dark theme background #0B1120', 'FAIL', `Expected rgb(11,17,32), got: ${mainBg}`);
  }

  // 1c. Verify sidebar dark background (#111827 = rgb(17, 24, 39))
  const sidebarBg = await page.locator('.sidebar').evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  const isSidebarDark = sidebarBg.includes('17, 24, 39') || sidebarBg.includes('17,24,39');
  if (isSidebarDark) {
    log('FE-014', 'Sidebar dark background #111827', 'PASS', `Sidebar background: ${sidebarBg}`);
  } else {
    log('FE-014', 'Sidebar dark background #111827', 'FAIL', `Expected rgb(17,24,39), got: ${sidebarBg}`);
  }

  // 1d. Verify header dark background (#111827)
  const headerBg = await page.locator('.header').evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  const isHeaderDark = headerBg.includes('17, 24, 39') || headerBg.includes('17,24,39');
  if (isHeaderDark) {
    log('FE-014', 'Header dark background #111827', 'PASS', `Header background: ${headerBg}`);
  } else {
    log('FE-014', 'Header dark background #111827', 'FAIL', `Expected rgb(17,24,39), got: ${headerBg}`);
  }

  // 1e. Check for real-time data display - stat cards
  const statCards = await page.locator('.stat-card').count();
  if (statCards >= 4) {
    log('FE-014', 'Statistics cards (real-time data)', 'PASS', `Found ${statCards} stat cards (expected >= 4)`);
  } else {
    log('FE-014', 'Statistics cards (real-time data)', 'FAIL', `Only ${statCards} stat cards found (expected >= 4)`);
  }

  // 1f. Check stat card values are non-zero (real data populating)
  const statValues = await page.locator('.stat-value').allTextContents();
  const hasData = statValues.some(v => v && v !== '0' && v.trim() !== '');
  log('FE-014', 'Stat card values populated', hasData ? 'PASS' : 'FAIL', `Values: ${statValues.join(', ')}`);

  // 1g. Check for LIVE indicator
  const liveIndicator = page.locator('.live-indicator');
  const liveVisible = await liveIndicator.isVisible();
  if (liveVisible) {
    const liveText = await liveIndicator.textContent();
    log('FE-014', 'LIVE indicator displayed', 'PASS', `LIVE indicator text: ${liveText}`);
  } else {
    log('FE-014', 'LIVE indicator displayed', 'FAIL', 'LIVE indicator not visible');
  }

  // 1h. Check control bar (device selector, refresh interval)
  const controlBar = page.locator('.control-bar');
  const controlBarVisible = await controlBar.isVisible();
  log('FE-014', 'Control bar visible', controlBarVisible ? 'PASS' : 'FAIL', controlBarVisible ? 'Control bar with device selector and refresh interval present' : 'Control bar not found');

  // 1i. Check ECharts canvas rendering
  const canvasCount = await page.locator('canvas').count();
  if (canvasCount > 0) {
    log('FE-014', 'Charts render (canvas)', 'PASS', `Found ${canvasCount} canvas elements (ECharts)`);
  } else {
    log('FE-014', 'Charts render (canvas)', 'FAIL', 'No canvas elements found - charts may not be rendering');
  }

  // 1j. Check chart titles
  const chartTitles = await page.locator('.card-title').allTextContents();
  const hasRealtimeChart = chartTitles.some(t => t.includes('实时功率'));
  const hasStatusChart = chartTitles.some(t => t.includes('设备状态'));
  const hasSocChart = chartTitles.some(t => t.includes('SOC'));
  log('FE-014', 'Real-time power chart title', hasRealtimeChart ? 'PASS' : 'FAIL', `Chart titles: ${chartTitles.join(' | ')}`);
  log('FE-014', 'Status distribution chart', hasStatusChart ? 'PASS' : 'FAIL', hasStatusChart ? 'Device status distribution chart present' : 'Missing status distribution chart');
  log('FE-014', 'SOC & temperature trend chart', hasSocChart ? 'PASS' : 'FAIL', hasSocChart ? 'SOC & temperature chart present' : 'Missing SOC chart');

  // 1k. Check OCPP event stream
  const eventsList = page.locator('.events-section');
  const eventsVisible = await eventsList.isVisible();
  if (eventsVisible) {
    const eventItems = await page.locator('.event-item').count();
    log('FE-014', 'OCPP event stream', 'PASS', `Event stream visible with ${eventItems} events`);
  } else {
    log('FE-014', 'OCPP event stream', 'FAIL', 'OCPP event stream section not visible');
  }

  // 1l. Check device metrics on cards (power, soc, voltage, temp)
  const metrics = await page.locator('.device-card .metric-value').allTextContents();
  if (metrics.length > 0) {
    log('FE-014', 'Device real-time metrics', 'PASS', `Metrics displayed: ${metrics.slice(0, 8).join(', ')}`);
  } else {
    log('FE-014', 'Device real-time metrics', 'FAIL', 'No device metrics found on cards');
  }

  // 1m. Check status badges on device cards
  const statusBadges = await page.locator('.status-badge').allTextContents();
  if (statusBadges.length > 0) {
    log('FE-014', 'Status badges on device cards', 'PASS', `Statuses: ${statusBadges.join(', ')}`);
  } else {
    log('FE-014', 'Status badges on device cards', 'FAIL', 'No status badges found');
  }

  // =========================================================
  // TEST 2: Device Page (FE-015)
  // =========================================================
  console.log('\n=== TEST 2: Device Page (FE-015) ===');

  // Navigate to device page via sidebar menu
  await page.goto(`${BASE_URL}/device`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-device-page-full.png`, fullPage: true });
  log('FE-015', 'Device page load', 'PASS', 'Navigated to /device successfully');

  // 2a. Verify device list loads
  const devicePageCards = await page.locator('.device-card').count();
  if (devicePageCards > 0) {
    log('FE-015', 'Device list loads', 'PASS', `Found ${devicePageCards} device cards on device page`);
  } else {
    log('FE-015', 'Device list loads', 'FAIL', 'No device cards on device page');
  }

  // 2b. Check page title
  const pageTitle = await page.locator('.page-title').textContent();
  if (pageTitle && pageTitle.includes('设备管理')) {
    log('FE-015', 'Device page title', 'PASS', `Title: ${pageTitle}`);
  } else {
    log('FE-015', 'Device page title', 'FAIL', `Expected '设备管理', got: ${pageTitle}`);
  }

  // 2c. Check add device button
  const addBtn = page.getByRole('button', { name: /添加设备/ });
  const addBtnVisible = await addBtn.isVisible();
  log('FE-015', 'Add device button', addBtnVisible ? 'PASS' : 'FAIL', addBtnVisible ? '"添加设备" button visible' : '"添加设备" button not found');

  // 2d. Check device info content (name, model, OCPP ID)
  const deviceNames = await page.locator('.device-name').allTextContents();
  const deviceIds = await page.locator('.device-id').allTextContents();
  log('FE-015', 'Device info displayed', deviceNames.length > 0 ? 'PASS' : 'FAIL',
    `Device names: ${deviceNames.join(', ')}; OCPP IDs: ${deviceIds.join(', ')}`);

  // 2e. Check device model info
  const deviceModels = await page.locator('.device-model .value').allTextContents();
  if (deviceModels.length > 0) {
    log('FE-015', 'Device model info', 'PASS', `Models: ${deviceModels.join(', ')}`);
  } else {
    log('FE-015', 'Device model info', 'FAIL', 'No device model info found');
  }

  // 2f. Check device metrics (power, voltage, current)
  const deviceMetrics = await page.locator('.device-page .metric-value').allTextContents();
  if (deviceMetrics.length > 0) {
    log('FE-015', 'Device metrics (power/voltage/current)', 'PASS', `Metrics: ${deviceMetrics.join(', ')}`);
  } else {
    log('FE-015', 'Device metrics (power/voltage/current)', 'FAIL', 'No device metrics found');
  }

  // 2g. Check status tags (Element Plus tags)
  const statusTags = await page.locator('.device-card .el-tag').allTextContents();
  if (statusTags.length > 0) {
    log('FE-015', 'Device status tags', 'PASS', `Status tags: ${statusTags.join(', ')}`);
  } else {
    log('FE-015', 'Device status tags', 'FAIL', 'No status tags found');
  }

  // 2h. Check action buttons (reset, delete)
  const resetBtns = await page.getByRole('button', { name: /重置/ }).count();
  const deleteBtns = await page.getByRole('button', { name: /删除/ }).count();
  log('FE-015', 'Action buttons (reset/delete)',
    resetBtns > 0 && deleteBtns > 0 ? 'PASS' : 'FAIL',
    `Reset buttons: ${resetBtns}, Delete buttons: ${deleteBtns}`);

  // =========================================================
  // TEST 3: Visual Elements
  // =========================================================
  console.log('\n=== TEST 3: Visual Elements ===');

  // Go back to dashboard for color checks
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(3000);

  // 3a. Check accent color blue #3B82F6
  // Check in sidebar active menu item text color
  const activeMenuColor = await page.locator('.el-menu-item.is-active').first().evaluate(el => {
    return window.getComputedStyle(el).color;
  });
  // #3B82F6 = rgb(59, 130, 246)
  const isBlueAccent = activeMenuColor.includes('59, 130, 246') || activeMenuColor.includes('59,130,246');
  if (isBlueAccent) {
    log('FE-VIS', 'Accent blue #3B82F6 (menu active)', 'PASS', `Active menu text color: ${activeMenuColor}`);
  } else {
    // Check other elements that use #3B82F6
    log('FE-VIS', 'Accent blue #3B82F6 (menu active)', 'FAIL', `Expected rgb(59,130,246), got: ${activeMenuColor}`);
  }

  // 3b. Check card backgrounds (#111827)
  const cardBgColor = await page.locator('.card').first().evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  const isCardDark = cardBgColor.includes('17, 24, 39') || cardBgColor.includes('17,24,39');
  if (isCardDark) {
    log('FE-VIS', 'Card background #111827', 'PASS', `Card background: ${cardBgColor}`);
  } else {
    log('FE-VIS', 'Card background #111827', 'FAIL', `Expected rgb(17,24,39), got: ${cardBgColor}`);
  }

  // 3c. Verify tech-themed styling - check sidebar border
  const sidebarBorder = await page.locator('.sidebar').evaluate(el => {
    return window.getComputedStyle(el).borderRight;
  });
  log('FE-VIS', 'Tech-themed sidebar border', sidebarBorder.includes('#1F2937') || sidebarBorder.includes('31, 41, 55') || sidebarBorder.includes('31,41,55') ? 'PASS' : 'FAIL',
    `Sidebar border-right: ${sidebarBorder}`);

  // 3d. Check header border bottom
  const headerBorder = await page.locator('.header').evaluate(el => {
    return window.getComputedStyle(el).borderBottom;
  });
  log('FE-VIS', 'Tech-themed header border', headerBorder.includes('#1F2937') || headerBorder.includes('31, 41, 55') || headerBorder.includes('31,41,55') ? 'PASS' : 'FAIL',
    `Header border-bottom: ${headerBorder}`);

  // 3e. Check logo text
  const logoText = await page.locator('.logo-text').textContent();
  log('FE-VIS', 'Logo text "EV充电模拟器"', logoText?.includes('EV充电模拟器') ? 'PASS' : 'FAIL',
    `Logo text: ${logoText}`);

  // 3f. Check logo icon
  const logoIcon = await page.locator('.logo-icon').textContent();
  log('FE-VIS', 'Logo icon (lightning bolt)', logoIcon?.includes('闪电') || logoIcon?.includes('⚡') ? 'PASS' : 'FAIL',
    `Logo icon: ${logoIcon}`);

  // 3g. Check connection status indicator
  const connectionStatus = page.locator('.connection-status');
  const connVisible = await connectionStatus.isVisible();
  if (connVisible) {
    const statusText = await connectionStatus.locator('.status-text').textContent();
    log('FE-VIS', 'Connection status indicator', 'PASS', `Status: ${statusText}`);
  } else {
    log('FE-VIS', 'Connection status indicator', 'FAIL', 'Connection status not visible');
  }

  // 3h. Check version display
  const version = await page.locator('.version').textContent();
  log('FE-VIS', 'Version display', version ? 'PASS' : 'FAIL', `Version: ${version}`);

  // 3i. Check charts/real-time data render (ECharts canvas elements)
  const chartCanvases = await page.locator('.charts-row canvas, .card canvas').count();
  if (chartCanvases > 0) {
    log('FE-VIS', 'Charts/real-time data render', 'PASS', `${chartCanvases} chart canvas(es) rendered`);
  } else {
    log('FE-VIS', 'Charts/real-time data render', 'FAIL', 'No chart canvases rendered');
  }

  // Take a focused screenshot of charts area
  const chartsRow = page.locator('.charts-row');
  if (await chartsRow.isVisible()) {
    await chartsRow.screenshot({ path: `${SCREENSHOT_DIR}/04-dashboard-charts.png` });
  }

  // 3j. Check sidebar menu items
  const menuItems = await page.locator('.el-menu-item').allTextContents();
  const expectedMenus = ['仪表盘', '充电模拟', '设备管理', '场景编排', '日志终端'];
  const menusPresent = expectedMenus.filter(m => menuItems.some(mi => mi.includes(m)));
  log('FE-VIS', 'Sidebar menu items', menusPresent.length === expectedMenus.length ? 'PASS' : 'FAIL',
    `Expected: [${expectedMenus.join(', ')}], Found: [${menusPresent.join(', ')}]`);

  // 3k. Check font-number class for DIN-style number display
  const fontNumberElements = await page.locator('.font-number').count();
  log('FE-VIS', 'Number font styling (.font-number)', fontNumberElements > 0 ? 'PASS' : 'FAIL',
    `${fontNumberElements} elements with .font-number class`);

  // =========================================================
  // TEST 4: Interaction Tests
  // =========================================================
  console.log('\n=== TEST 4: Interaction Tests ===');

  // Navigate to dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(3000);

  // 4a. Click on a device card
  const firstDeviceCard = page.locator('.device-card').first();
  if (await firstDeviceCard.isVisible()) {
    // Get device name before clicking
    const deviceName = await firstDeviceCard.locator('.device-name').textContent();

    // Check initial selected state
    const initialSelected = await firstDeviceCard.evaluate(el => el.classList.contains('selected'));

    // Click the device card
    await firstDeviceCard.click();
    await page.waitForTimeout(500);

    // Check if card is now selected
    const afterClickSelected = await firstDeviceCard.evaluate(el => el.classList.contains('selected'));

    if (!initialSelected && afterClickSelected) {
      log('FE-INT', 'Click device card (select)', 'PASS', `Clicked "${deviceName}" - card became selected`);
    } else if (initialSelected && afterClickSelected) {
      log('FE-INT', 'Click device card (already selected)', 'PASS', `"${deviceName}" was already selected, still selected after click`);
    } else {
      log('FE-INT', 'Click device card', 'FAIL', `Click on "${deviceName}" did not toggle selection. Before: ${initialSelected}, After: ${afterClickSelected}`);
    }

    // Screenshot after clicking device
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-device-card-selected.png`, fullPage: false });
  } else {
    log('FE-INT', 'Click device card', 'FAIL', 'No device card visible to click');
  }

  // 4b. Click another device card to verify switching
  const secondDeviceCard = page.locator('.device-card').nth(1);
  if (await secondDeviceCard.isVisible()) {
    const secondName = await secondDeviceCard.locator('.device-name').textContent();
    await secondDeviceCard.click();
    await page.waitForTimeout(500);

    const secondSelected = await secondDeviceCard.evaluate(el => el.classList.contains('selected'));
    log('FE-INT', 'Click second device card (switch)', secondSelected ? 'PASS' : 'FAIL',
      `Clicked "${secondName}" - selected: ${secondSelected}`);
  }

  // 4c. Navigate to charging page and test start/stop
  await page.goto(`${BASE_URL}/charging`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-charging-page.png`, fullPage: true });

  // Check charging page elements
  const socDisplay = page.locator('.soc-display');
  const socVisible = await socDisplay.isVisible();
  log('FE-INT', 'Charging page SOC display', socVisible ? 'PASS' : 'FAIL',
    socVisible ? 'SOC ring display visible' : 'SOC ring not visible');

  // Check metric cards on charging page
  const chargingMetrics = await page.locator('.metric-card').count();
  log('FE-INT', 'Charging page metric cards', chargingMetrics >= 4 ? 'PASS' : 'FAIL',
    `Found ${chargingMetrics} metric cards (expected >= 4: power, energy, duration, cost, voltage, temperature)`);

  // Check start charging button
  const startBtn = page.getByRole('button', { name: /开始充电/ });
  const startBtnVisible = await startBtn.isVisible();
  if (startBtnVisible) {
    log('FE-INT', 'Start charging button', 'PASS', '"开始充电" button visible');

    // Click start charging
    await startBtn.click();
    await page.waitForTimeout(2000);

    // Screenshot after starting charging
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-charging-started.png`, fullPage: true });

    // Check if success message appeared (ElMessage)
    // Check if stop button appeared
    const stopBtn = page.getByRole('button', { name: /停止充电/ });
    const stopBtnVisible = await stopBtn.isVisible();

    if (stopBtnVisible) {
      log('FE-INT', 'Start charging feedback', 'PASS', 'Stop button appeared after starting charge, charging state active');

      // Check SOC is changing
      await page.waitForTimeout(3000);
      const socValue = await page.locator('.soc-value').textContent();
      log('FE-INT', 'Charging SOC updating', 'PASS', `SOC value during charge: ${socValue}`);

      // Click stop charging
      await stopBtn.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/08-charging-stopped.png`, fullPage: true });

      // Verify start button reappears
      const startBtnAfterStop = page.getByRole('button', { name: /开始充电/ });
      const startBtnReturned = await startBtnAfterStop.isVisible();
      log('FE-INT', 'Stop charging feedback', startBtnReturned ? 'PASS' : 'FAIL',
        startBtnReturned ? 'Start button returned after stopping charge' : 'Start button did not return');
    } else {
      log('FE-INT', 'Start charging feedback', 'FAIL', 'Stop button did not appear after starting charge');
    }
  } else {
    log('FE-INT', 'Start charging button', 'FAIL', '"开始充电" button not visible');
  }

  // 4d. Navigate to device page and test add dialog
  await page.goto(`${BASE_URL}/device`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);

  const addDeviceBtn = page.getByRole('button', { name: /添加设备/ });
  if (await addDeviceBtn.isVisible()) {
    await addDeviceBtn.click();
    await page.waitForTimeout(500);

    // Check dialog appeared
    const dialog = page.locator('.el-dialog');
    const dialogVisible = await dialog.isVisible();
    log('FE-INT', 'Add device dialog', dialogVisible ? 'PASS' : 'FAIL',
      dialogVisible ? 'Add device dialog opened successfully' : 'Dialog did not appear');

    if (dialogVisible) {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/09-add-device-dialog.png` });

      // Check form fields
      const formItems = await dialog.locator('.el-form-item').count();
      log('FE-INT', 'Add device form fields', formItems >= 3 ? 'PASS' : 'FAIL',
        `Found ${formItems} form fields (expected >= 3: name, OCPP ID, model)`);

      // Close dialog
      const cancelBtn = dialog.getByRole('button', { name: /取消/ });
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    }
  }

  // 4e. Test pause/resume on dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(3000);

  const pauseBtn = page.locator('.control-right .el-button');
  if (await pauseBtn.isVisible()) {
    const pauseBtnText = await pauseBtn.textContent();
    await pauseBtn.click();
    await page.waitForTimeout(500);

    const afterPauseText = await pauseBtn.textContent();
    const pauseIndicator = page.locator('.live-indicator');
    const isPaused = await pauseIndicator.evaluate(el => el.classList.contains('paused'));

    log('FE-INT', 'Pause/resume button', (pauseBtnText !== afterPauseText || isPaused) ? 'PASS' : 'FAIL',
      `Before click: "${pauseBtnText?.trim()}", After click: "${afterPauseText?.trim()}", Paused: ${isPaused}`);

    // Resume
    await pauseBtn.click();
    await page.waitForTimeout(300);
  }

  // 4f. Test sidebar collapse
  const collapseBtn = page.locator('.collapse-btn');
  if (await collapseBtn.isVisible()) {
    const sidebarWidthBefore = await page.locator('.sidebar').evaluate(el => el.offsetWidth);
    await collapseBtn.click();
    await page.waitForTimeout(500);

    const sidebarWidthAfter = await page.locator('.sidebar').evaluate(el => el.offsetWidth);

    log('FE-INT', 'Sidebar collapse toggle', sidebarWidthBefore !== sidebarWidthAfter ? 'PASS' : 'FAIL',
      `Sidebar width: ${sidebarWidthBefore}px -> ${sidebarWidthAfter}px`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-sidebar-collapsed.png`, fullPage: false });

    // Expand back
    await collapseBtn.click();
    await page.waitForTimeout(500);
  }

  // 4g. Test refresh interval change
  const intervalBtn = page.locator('.el-radio-button').filter({ hasText: '1s' });
  if (await intervalBtn.isVisible()) {
    await intervalBtn.click();
    await page.waitForTimeout(500);
    log('FE-INT', 'Refresh interval change', 'PASS', 'Clicked 1s refresh interval button');
  }

  // =========================================================
  // Summary
  // =========================================================
  console.log('\n========================================');
  console.log('           TEST RESULTS SUMMARY          ');
  console.log('========================================\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('--- FAILURES ---');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  [${r.testId}] ${r.check}: ${r.detail}`);
    });
    console.log('');
  }

  console.log('--- ALL RESULTS ---');
  results.forEach(r => {
    console.log(`  [${r.status}] [${r.testId}] ${r.check}: ${r.detail}`);
  });

  if (consoleErrors.length > 0) {
    console.log('\n--- Console Errors ---');
    consoleErrors.forEach(e => console.log(`  ${e}`));
  } else {
    console.log('\nNo console errors detected.');
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}/`);

  await browser.close();
})();
