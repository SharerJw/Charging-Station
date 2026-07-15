const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5177';
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = [];

function record(testId, description, status, details) {
  results.push({ testId, description, status, details });
  console.log(`[${status}] ${testId}: ${description} -- ${details}`);
}

function normalizeHex(hex) {
  const rgbMatch = hex.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }
  return hex.toUpperCase();
}

function hexCloseTo(actual, expected, tolerance) {
  tolerance = tolerance || 20;
  const a = normalizeHex(actual);
  const e = expected.toUpperCase();
  if (a === e) return true;
  const parseHex = (h) => {
    const match = h.match(/#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i);
    if (!match) return null;
    return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
  };
  const ac = parseHex(a);
  const ec = parseHex(e);
  if (!ac || !ec) return false;
  const dist = Math.sqrt((ac.r - ec.r) ** 2 + (ac.g - ec.g) ** 2 + (ac.b - ec.b) ** 2);
  return dist <= tolerance;
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // ============================================================
    // TEST 1: Dashboard (FE-014)
    // ============================================================
    console.log('\n===== TEST 1: Dashboard (FE-014) =====');

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-dashboard-full.png'), fullPage: true });

    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      record('FE-014-A', 'Dashboard loads and redirects to /dashboard', 'PASS', 'URL: ' + currentUrl);
    } else {
      record('FE-014-A', 'Dashboard loads and redirects to /dashboard', 'FAIL', 'Expected /dashboard in URL, got: ' + currentUrl);
    }

    const deviceCards = page.locator('.device-card');
    const deviceCardCount = await deviceCards.count();
    if (deviceCardCount > 0) {
      record('FE-014-B', 'Device cards are displayed on dashboard', 'PASS', 'Found ' + deviceCardCount + ' device cards');
    } else {
      record('FE-014-B', 'Device cards are displayed on dashboard', 'FAIL', 'No .device-card elements found');
    }

    const bodyBgColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    if (hexCloseTo(bodyBgColor, '#0B1120', 30)) {
      record('FE-014-C', 'Dark theme background is #0B1120', 'PASS', 'Body background: ' + bodyBgColor);
    } else {
      const mainContent = page.locator('.main-content');
      if (await mainContent.count() > 0) {
        const mainBg = await mainContent.evaluate(el => window.getComputedStyle(el).backgroundColor);
        if (hexCloseTo(mainBg, '#0B1120', 30)) {
          record('FE-014-C', 'Dark theme background is #0B1120', 'PASS', 'Main content background: ' + mainBg);
        } else {
          record('FE-014-C', 'Dark theme background is #0B1120', 'FAIL', 'Body: ' + bodyBgColor + ', Main: ' + mainBg);
        }
      } else {
        record('FE-014-C', 'Dark theme background is #0B1120', 'FAIL', 'Body background: ' + bodyBgColor);
      }
    }

    const statCards = page.locator('.stat-card');
    const statCardCount = await statCards.count();
    if (statCardCount >= 3) {
      record('FE-014-D', 'Stat cards with real-time data are displayed', 'PASS', 'Found ' + statCardCount + ' stat cards');
      const statValues = page.locator('.stat-value');
      const statValueTexts = [];
      for (let i = 0; i < await statValues.count(); i++) {
        statValueTexts.push(await statValues.nth(i).innerText());
      }
      const hasNonZero = statValueTexts.some(v => parseInt(v) > 0);
      record('FE-014-E', 'Stat cards show non-zero real-time values', hasNonZero ? 'PASS' : 'FAIL', 'Values: ' + statValueTexts.join(', '));
    } else {
      record('FE-014-D', 'Stat cards with real-time data are displayed', 'FAIL', 'Only found ' + statCardCount + ' stat cards');
      record('FE-014-E', 'Stat cards show non-zero real-time values', 'FAIL', 'No stat cards to check');
    }

    const canvasCount = await page.locator('canvas').count();
    record('FE-014-F', 'ECharts canvas elements render on dashboard', canvasCount > 0 ? 'PASS' : 'FAIL', 'Found ' + canvasCount + ' canvas elements');

    const liveIndicator = page.locator('.live-indicator');
    if (await liveIndicator.count() > 0) {
      record('FE-014-G', 'LIVE indicator is displayed', 'PASS', 'LIVE text: "' + await liveIndicator.innerText() + '"');
    } else {
      record('FE-014-G', 'LIVE indicator is displayed', 'FAIL', 'No .live-indicator found');
    }

    const eventsSection = page.locator('.events-section, .events-list');
    record('FE-014-H', 'OCPP event stream section is present', await eventsSection.count() > 0 ? 'PASS' : 'FAIL', 'Found ' + await eventsSection.count() + ' events sections');

    // ============================================================
    // TEST 2: Device Page (FE-015)
    // ============================================================
    console.log('\n===== TEST 2: Device Page (FE-015) =====');

    // Navigate directly to device page URL to avoid menu click issues
    await page.goto(BASE_URL + '/device', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-device-page.png'), fullPage: true });

    const deviceUrl = page.url();
    if (deviceUrl.includes('/device')) {
      record('FE-015-A', 'Device management page loads', 'PASS', 'URL: ' + deviceUrl);
    } else {
      record('FE-015-A', 'Device management page loads', 'FAIL', 'Expected /device in URL, got: ' + deviceUrl);
    }

    // Check page title
    const pageTitle = page.locator('.page-title');
    if (await pageTitle.count() > 0) {
      const titleText = await pageTitle.first().innerText();
      record('FE-015-B', 'Device page title shows "设备管理"', titleText.includes('设备管理') ? 'PASS' : 'FAIL', 'Title: "' + titleText + '"');
    } else {
      // Try h2
      const h2Title = page.locator('h2');
      if (await h2Title.count() > 0) {
        const h2Text = await h2Title.first().innerText();
        record('FE-015-B', 'Device page title shows "设备管理"', h2Text.includes('设备管理') ? 'PASS' : 'FAIL', 'H2: "' + h2Text + '"');
      } else {
        record('FE-015-B', 'Device page title shows "设备管理"', 'FAIL', 'No .page-title or h2 found');
      }
    }

    // Check device list
    const devicePageCards = page.locator('.device-page .device-card, .device-grid .device-card');
    const devicePageCount = await devicePageCards.count();
    if (devicePageCount > 0) {
      record('FE-015-C', 'Device list loads with device cards', 'PASS', 'Found ' + devicePageCount + ' device cards');
    } else {
      record('FE-015-C', 'Device list loads with device cards', 'FAIL', 'No device cards found on device page');
    }

    // Check device name
    const deviceNameEl = page.locator('.device-page .device-name, .device-grid .device-name');
    if (await deviceNameEl.count() > 0) {
      const name = await deviceNameEl.first().innerText();
      record('FE-015-D', 'Device card shows device name', 'PASS', 'Device name: "' + name + '"');
    } else {
      record('FE-015-D', 'Device card shows device name', 'FAIL', 'No .device-name found on device page');
    }

    // Check status tags
    const statusTags = page.locator('.device-page .el-tag');
    const statusTagCount = await statusTags.count();
    if (statusTagCount > 0) {
      record('FE-015-E', 'Device status tags are displayed', 'PASS', 'Found ' + statusTagCount + ' status tags');
    } else {
      record('FE-015-E', 'Device status tags are displayed', 'FAIL', 'No status tags found on device page');
    }

    // Check Add Device button
    const addBtn = page.locator('button').filter({ hasText: '添加设备' });
    if (await addBtn.count() > 0) {
      record('FE-015-F', 'Add Device button is present', 'PASS', 'Found "添加设备" button');
    } else {
      record('FE-015-F', 'Add Device button is present', 'FAIL', 'No "添加设备" button found');
    }

    // Check action buttons
    const resetBtns = page.locator('.device-page button').filter({ hasText: '重置' });
    const deleteBtns = page.locator('.device-page button').filter({ hasText: '删除' });
    const resetCount = await resetBtns.count();
    const deleteCount = await deleteBtns.count();
    if (resetCount > 0 && deleteCount > 0) {
      record('FE-015-G', 'Device action buttons (reset/delete) are present', 'PASS', 'Reset: ' + resetCount + ', Delete: ' + deleteCount);
    } else {
      record('FE-015-G', 'Device action buttons (reset/delete) are present', 'FAIL', 'Reset: ' + resetCount + ', Delete: ' + deleteCount);
    }

    // ============================================================
    // TEST 3: Visual Elements
    // ============================================================
    console.log('\n===== TEST 3: Visual Elements =====');

    // Go back to dashboard for visual checks
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const accentColor = await page.evaluate(() => window.getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim());
    record('FE-016-A', 'Accent color is #3B82F6 (tech blue)', (accentColor.toUpperCase() === '#3B82F6' || hexCloseTo(accentColor, '#3B82F6', 5)) ? 'PASS' : 'FAIL', '--color-primary: ' + accentColor);

    const cardBg = await page.evaluate(() => window.getComputedStyle(document.documentElement).getPropertyValue('--color-bg-card').trim());
    record('FE-016-B', 'Card background is #111827', hexCloseTo(cardBg, '#111827', 5) ? 'PASS' : 'FAIL', '--color-bg-card: ' + cardBg);

    const sidebarBg = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar') || document.querySelector('.el-aside');
      return sidebar ? window.getComputedStyle(sidebar).backgroundColor : 'NOT_FOUND';
    });
    record('FE-016-C', 'Sidebar has dark tech-themed styling (#111827)', hexCloseTo(sidebarBg, '#111827', 30) ? 'PASS' : 'FAIL', 'Sidebar background: ' + sidebarBg);

    const headerBg = await page.evaluate(() => {
      const header = document.querySelector('.header') || document.querySelector('.el-header');
      return header ? window.getComputedStyle(header).backgroundColor : 'NOT_FOUND';
    });
    record('FE-016-D', 'Header has dark themed styling (#111827)', hexCloseTo(headerBg, '#111827', 30) ? 'PASS' : 'FAIL', 'Header background: ' + headerBg);

    const textColor = await page.evaluate(() => window.getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim());
    record('FE-016-E', 'Text primary color is light (#E5E7EB)', hexCloseTo(textColor, '#E5E7EB', 30) ? 'PASS' : 'FAIL', '--color-text-primary: ' + textColor);

    const borderColor = await page.evaluate(() => window.getComputedStyle(document.documentElement).getPropertyValue('--color-border-light').trim());
    record('FE-016-F', 'Card border color is dark (#1F2937)', hexCloseTo(borderColor, '#1F2937', 10) ? 'PASS' : 'FAIL', '--color-border-light: ' + borderColor);

    // Charts with content
    const canvasElCount = await page.locator('canvas').count();
    if (canvasElCount > 0) {
      const hasContent = await page.evaluate(() => {
        const canvases = document.querySelectorAll('canvas');
        for (const canvas of canvases) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const w = Math.min(canvas.width, 200);
            const h = Math.min(canvas.height, 200);
            if (w === 0 || h === 0) continue;
            const imageData = ctx.getImageData(0, 0, w, h);
            let nonBlackPixels = 0;
            for (let i = 0; i < imageData.data.length; i += 4) {
              if (imageData.data[i] > 10 || imageData.data[i + 1] > 10 || imageData.data[i + 2] > 10) {
                nonBlackPixels++;
              }
            }
            if (nonBlackPixels > 100) return true;
          }
        }
        return false;
      });
      record('FE-016-G', 'Charts render with actual data (non-blank canvas)', hasContent ? 'PASS' : 'FAIL', 'Found ' + canvasElCount + ' canvas elements, hasContent: ' + hasContent);
    } else {
      record('FE-016-G', 'Charts render with actual data (non-blank canvas)', 'FAIL', 'No canvas elements found');
    }

    const codeFont = await page.evaluate(() => window.getComputedStyle(document.documentElement).getPropertyValue('--font-family-code').trim());
    record('FE-016-H', 'Code/number fonts use tech-themed monospace', (codeFont.includes('Cascadia') || codeFont.includes('Fira') || codeFont.includes('monospace')) ? 'PASS' : 'FAIL', '--font-family-code: ' + codeFont);

    // ============================================================
    // TEST 4: Interactions
    // ============================================================
    console.log('\n===== TEST 4: Interactions =====');

    // FE-017-A: Click device card
    const dashDeviceCards = page.locator('.device-card');
    if (await dashDeviceCards.count() > 0) {
      await dashDeviceCards.first().click();
      await page.waitForTimeout(500);
      const cls = await dashDeviceCards.first().getAttribute('class');
      record('FE-017-A', 'Clicking device card applies "selected" visual state', (cls && cls.includes('selected')) ? 'PASS' : 'FAIL', 'Class: "' + cls + '"');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-device-selected.png'), fullPage: false });
    } else {
      record('FE-017-A', 'Clicking device card applies "selected" visual state', 'FAIL', 'No device cards to click');
    }

    // FE-017-B/C: Pause/Resume
    const pauseBtn = page.locator('button').filter({ hasText: '暂停' });
    if (await pauseBtn.count() > 0) {
      await pauseBtn.first().click();
      await page.waitForTimeout(500);
      const resumeBtn = page.locator('button').filter({ hasText: '继续' });
      if (await resumeBtn.count() > 0) {
        record('FE-017-B', 'Pause button toggles to resume state', 'PASS', 'Button changed to "继续"');
        const liveInd = page.locator('.live-indicator');
        const liveClass = await liveInd.count() > 0 ? await liveInd.getAttribute('class') : '';
        record('FE-017-C', 'LIVE indicator shows paused state', (liveClass && liveClass.includes('paused')) ? 'PASS' : 'FAIL', 'Class: ' + liveClass);
        await resumeBtn.first().click();
        await page.waitForTimeout(300);
      } else {
        record('FE-017-B', 'Pause button toggles to resume state', 'FAIL', 'Button did not change');
        record('FE-017-C', 'LIVE indicator shows paused state', 'FAIL', 'Cannot check');
      }
    } else {
      record('FE-017-B', 'Pause button toggles to resume state', 'FAIL', 'No "暂停" button');
      record('FE-017-C', 'LIVE indicator shows paused state', 'FAIL', 'No pause button');
    }

    // FE-017-D: Delete confirmation dialog - navigate to device page
    await page.goto(BASE_URL + '/device', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const deleteBtn = page.locator('.device-page button').filter({ hasText: '删除' }).first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      const dialog = page.locator('.el-message-box');
      if (await dialog.count() > 0 && await dialog.first().isVisible()) {
        const dialogText = await dialog.first().innerText();
        record('FE-017-D', 'Delete button triggers confirmation dialog', 'PASS', 'Dialog: "' + dialogText.substring(0, 60) + '..."');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } else {
        record('FE-017-D', 'Delete button triggers confirmation dialog', 'FAIL', 'No dialog appeared');
      }
    } else {
      record('FE-017-D', 'Delete button triggers confirmation dialog', 'FAIL', 'No delete button found on device page');
    }

    // FE-017-E: Add Device dialog
    const addDeviceBtn = page.locator('button').filter({ hasText: '添加设备' });
    if (await addDeviceBtn.count() > 0) {
      await addDeviceBtn.first().click();
      await page.waitForTimeout(500);
      const addDialog = page.locator('.el-dialog');
      if (await addDialog.count() > 0 && await addDialog.first().isVisible()) {
        record('FE-017-E', 'Add Device button opens dialog', 'PASS', 'Dialog is visible');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-add-device-dialog.png'), fullPage: false });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } else {
        record('FE-017-E', 'Add Device button opens dialog', 'FAIL', 'No dialog appeared');
      }
    } else {
      record('FE-017-E', 'Add Device button opens dialog', 'FAIL', 'No "添加设备" button');
    }

    // FE-017-F: Refresh interval selector
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const refreshButtons = page.locator('.el-radio-button');
    if (await refreshButtons.count() > 0) {
      const oneSecBtn = page.locator('.el-radio-button').filter({ hasText: '1s' });
      if (await oneSecBtn.count() > 0) {
        await oneSecBtn.first().click();
        await page.waitForTimeout(500);
        record('FE-017-F', 'Refresh interval selector works (clicked 1s)', 'PASS', 'Found ' + await refreshButtons.count() + ' interval options');
      } else {
        record('FE-017-F', 'Refresh interval selector works (clicked 1s)', 'FAIL', 'No 1s option');
      }
    } else {
      record('FE-017-F', 'Refresh interval selector works (clicked 1s)', 'FAIL', 'No radio buttons');
    }

    // FE-017-G: Navigate all pages
    const menuItems = ['仪表盘', '充电模拟', '设备管理', '场景编排', '日志终端'];
    let navSuccessCount = 0;
    for (const item of menuItems) {
      const mi = page.locator('.el-menu-item').filter({ hasText: item });
      if (await mi.count() > 0) {
        await mi.click();
        await page.waitForTimeout(1500);
        navSuccessCount++;
      }
    }
    record('FE-017-G', 'All sidebar navigation items work', navSuccessCount === menuItems.length ? 'PASS' : 'FAIL', 'Navigated to ' + navSuccessCount + '/' + menuItems.length + ' pages');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-final-state.png'), fullPage: true });

  } catch (err) {
    console.error('Test execution error:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-screenshot.png'), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  for (const r of results) {
    console.log('  [' + r.status + '] ' + r.testId + ': ' + r.description);
    if (r.status === 'FAIL') {
      console.log('         Details: ' + r.details);
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log('Total: ' + total + ' | PASS: ' + passed + ' | FAIL: ' + failed + ' | Pass Rate: ' + ((passed / total) * 100).toFixed(1) + '%');
  console.log('='.repeat(70));

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'test-results.json'),
    JSON.stringify({ summary: { total, passed, failed, passRate: ((passed / total) * 100).toFixed(1) + '%' }, results }, null, 2)
  );
  console.log('\nResults written to: ' + path.join(SCREENSHOT_DIR, 'test-results.json'));
  console.log('Screenshots saved to: ' + SCREENSHOT_DIR);
}

runTests().catch(console.error);
