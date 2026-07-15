import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:5176';
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface TestResult {
  testId: string;
  description: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function record(testId: string, description: string, status: 'PASS' | 'FAIL', details: string) {
  results.push({ testId, description, status, details });
  console.log(`[${status}] ${testId}: ${description} — ${details}`);
}

function normalizeHex(hex: string): string {
  // Convert rgb(r, g, b) to #hex
  const rgbMatch = hex.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }
  return hex.toUpperCase();
}

function hexCloseTo(actual: string, expected: string, tolerance = 20): boolean {
  const a = normalizeHex(actual);
  const e = expected.toUpperCase();
  if (a === e) return true;

  // Parse hex values
  const parseHex = (h: string) => {
    const match = h.match(/#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i);
    if (!match) return null;
    return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
  };

  const ac = parseHex(a);
  const ec = parseHex(e);
  if (!ac || !ec) return false;

  const dist = Math.sqrt(
    (ac.r - ec.r) ** 2 + (ac.g - ec.g) ** 2 + (ac.b - ec.b) ** 2
  );
  return dist <= tolerance;
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // ============================================================
    // TEST 1: Dashboard (FE-014)
    // ============================================================
    console.log('\n===== TEST 1: Dashboard (FE-014) =====');

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait for data to load
    await page.waitForTimeout(3000);

    // Take dashboard screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-dashboard-full.png'), fullPage: true });
    console.log('Screenshot saved: 01-dashboard-full.png');

    // FE-014-A: Check page loads (redirected to /dashboard)
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      record('FE-014-A', 'Dashboard loads and redirects to /dashboard', 'PASS', `URL: ${currentUrl}`);
    } else {
      record('FE-014-A', 'Dashboard loads and redirects to /dashboard', 'FAIL', `Expected /dashboard in URL, got: ${currentUrl}`);
    }

    // FE-014-B: Check device cards are displayed
    const deviceCards = page.locator('.device-card');
    const deviceCardCount = await deviceCards.count();
    if (deviceCardCount > 0) {
      record('FE-014-B', 'Device cards are displayed on dashboard', 'PASS', `Found ${deviceCardCount} device cards`);
    } else {
      record('FE-014-B', 'Device cards are displayed on dashboard', 'FAIL', 'No .device-card elements found');
    }

    // FE-014-C: Check dark theme background (#0B1120)
    const bodyBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    if (hexCloseTo(bodyBgColor, '#0B1120', 30)) {
      record('FE-014-C', 'Dark theme background is #0B1120', 'PASS', `Body background: ${bodyBgColor}`);
    } else {
      // Check the main content area too
      const mainContent = page.locator('.main-content');
      if (await mainContent.count() > 0) {
        const mainBg = await mainContent.evaluate(el => window.getComputedStyle(el).backgroundColor);
        if (hexCloseTo(mainBg, '#0B1120', 30)) {
          record('FE-014-C', 'Dark theme background is #0B1120', 'PASS', `Main content background: ${mainBg}`);
        } else {
          record('FE-014-C', 'Dark theme background is #0B1120', 'FAIL', `Body: ${bodyBgColor}, Main: ${mainBg}`);
        }
      } else {
        record('FE-014-C', 'Dark theme background is #0B1120', 'FAIL', `Body background: ${bodyBgColor}`);
      }
    }

    // FE-014-D: Check stat cards (real-time data display)
    const statCards = page.locator('.stat-card');
    const statCardCount = await statCards.count();
    if (statCardCount >= 3) {
      record('FE-014-D', 'Stat cards with real-time data are displayed', 'PASS', `Found ${statCardCount} stat cards`);

      // Check that stat values have actual numbers
      const statValues = page.locator('.stat-value');
      const statValueTexts: string[] = [];
      for (let i = 0; i < await statValues.count(); i++) {
        const text = await statValues.nth(i).innerText();
        statValueTexts.push(text);
      }
      const hasNonZero = statValueTexts.some(v => parseInt(v) > 0);
      if (hasNonZero) {
        record('FE-014-E', 'Stat cards show non-zero real-time values', 'PASS', `Values: ${statValueTexts.join(', ')}`);
      } else {
        record('FE-014-E', 'Stat cards show non-zero real-time values', 'FAIL', `All values zero: ${statValueTexts.join(', ')}`);
      }
    } else {
      record('FE-014-D', 'Stat cards with real-time data are displayed', 'FAIL', `Only found ${statCardCount} stat cards`);
      record('FE-014-E', 'Stat cards show non-zero real-time values', 'FAIL', 'No stat cards to check');
    }

    // FE-014-F: Check charts render
    const chartCanvases = page.locator('.card canvas, v-chart canvas, canvas');
    const canvasCount = await chartCanvases.count();
    if (canvasCount > 0) {
      record('FE-014-F', 'ECharts canvas elements render on dashboard', 'PASS', `Found ${canvasCount} canvas elements`);
    } else {
      // Try alternative: check for chart containers
      const vChartEls = page.locator('[_echarts_instance_], .echarts, [_echarts_instance_]');
      const echartsCount = await vChartEls.count();
      if (echartsCount > 0) {
        record('FE-014-F', 'ECharts canvas elements render on dashboard', 'PASS', `Found ${echartsCount} ECharts instances`);
      } else {
        record('FE-014-F', 'ECharts canvas elements render on dashboard', 'FAIL', 'No canvas or ECharts elements found');
      }
    }

    // FE-014-G: Check LIVE indicator
    const liveIndicator = page.locator('.live-indicator');
    if (await liveIndicator.count() > 0) {
      const liveText = await liveIndicator.innerText();
      record('FE-014-G', 'LIVE indicator is displayed', 'PASS', `LIVE text: "${liveText}"`);
    } else {
      record('FE-014-G', 'LIVE indicator is displayed', 'FAIL', 'No .live-indicator found');
    }

    // FE-014-H: Check OCPP event stream section
    const eventsSection = page.locator('.events-section, .events-list');
    if (await eventsSection.count() > 0) {
      record('FE-014-H', 'OCPP event stream section is present', 'PASS', 'Found events section');
    } else {
      record('FE-014-H', 'OCPP event stream section is present', 'FAIL', 'No events section found');
    }

    // ============================================================
    // TEST 2: Device Page (FE-015)
    // ============================================================
    console.log('\n===== TEST 2: Device Page (FE-015) =====');

    // Navigate to device page via sidebar menu
    const deviceMenuItem = page.locator('.el-menu-item').filter({ hasText: '设备管理' });
    if (await deviceMenuItem.count() > 0) {
      await deviceMenuItem.click();
      await page.waitForTimeout(1500);
    } else {
      await page.goto(`${BASE_URL}/device`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-device-page.png'), fullPage: true });
    console.log('Screenshot saved: 02-device-page.png');

    // FE-015-A: Check device page loads
    const deviceUrl = page.url();
    if (deviceUrl.includes('/device')) {
      record('FE-015-A', 'Device management page loads', 'PASS', `URL: ${deviceUrl}`);
    } else {
      record('FE-015-A', 'Device management page loads', 'FAIL', `Expected /device in URL, got: ${deviceUrl}`);
    }

    // FE-015-B: Check device page title
    const pageTitle = page.locator('.page-title, h2');
    if (await pageTitle.count() > 0) {
      const titleText = await pageTitle.first().innerText();
      if (titleText.includes('设备管理')) {
        record('FE-015-B', 'Device page title shows "设备管理"', 'PASS', `Title: "${titleText}"`);
      } else {
        record('FE-015-B', 'Device page title shows "设备管理"', 'FAIL', `Title: "${titleText}"`);
      }
    } else {
      record('FE-015-B', 'Device page title shows "设备管理"', 'FAIL', 'No page title element found');
    }

    // FE-015-C: Check device list loads
    const devicePageCards = page.locator('.device-page .device-card, .device-grid .device-card');
    const devicePageCount = await devicePageCards.count();
    if (devicePageCount > 0) {
      record('FE-015-C', 'Device list loads with device cards', 'PASS', `Found ${devicePageCount} device cards`);
    } else {
      record('FE-015-C', 'Device list loads with device cards', 'FAIL', 'No device cards found on device page');
    }

    // FE-015-D: Check device has name and model info
    if (devicePageCount > 0) {
      const firstDeviceName = page.locator('.device-name').first();
      const firstDeviceModel = page.locator('.device-model').first();
      if (await firstDeviceName.count() > 0) {
        const name = await firstDeviceName.innerText();
        record('FE-015-D', 'Device card shows device name', 'PASS', `Device name: "${name}"`);
      } else {
        record('FE-015-D', 'Device card shows device name', 'FAIL', 'No .device-name found');
      }
    } else {
      record('FE-015-D', 'Device card shows device name', 'FAIL', 'No device cards to check');
    }

    // FE-015-E: Check device status tags
    const statusTags = page.locator('.device-page .el-tag, .device-card .el-tag');
    const statusTagCount = await statusTags.count();
    if (statusTagCount > 0) {
      const firstTagText = await statusTags.first().innerText();
      record('FE-015-E', 'Device status tags are displayed', 'PASS', `Found ${statusTagCount} status tags, first: "${firstTagText}"`);
    } else {
      // Check for .status-badge instead
      const statusBadge = page.locator('.status-badge');
      if (await statusBadge.count() > 0) {
        record('FE-015-E', 'Device status tags are displayed', 'PASS', `Found ${await statusBadge.count()} status badges`);
      } else {
        record('FE-015-E', 'Device status tags are displayed', 'FAIL', 'No status tags or badges found');
      }
    }

    // FE-015-F: Check "Add Device" button exists
    const addBtn = page.locator('button').filter({ hasText: '添加设备' });
    if (await addBtn.count() > 0) {
      record('FE-015-F', 'Add Device button is present', 'PASS', 'Found "添加设备" button');
    } else {
      record('FE-015-F', 'Add Device button is present', 'FAIL', 'No "添加设备" button found');
    }

    // FE-015-G: Check device action buttons (reset/delete)
    const resetBtns = page.locator('button').filter({ hasText: '重置' });
    const deleteBtns = page.locator('button').filter({ hasText: '删除' });
    if (await resetBtns.count() > 0 && await deleteBtns.count() > 0) {
      record('FE-015-G', 'Device action buttons (reset/delete) are present', 'PASS', `Reset: ${await resetBtns.count()}, Delete: ${await deleteBtns.count()}`);
    } else {
      record('FE-015-G', 'Device action buttons (reset/delete) are present', 'FAIL', `Reset: ${await resetBtns.count()}, Delete: ${await deleteBtns.count()}`);
    }

    // ============================================================
    // TEST 3: Visual Elements
    // ============================================================
    console.log('\n===== TEST 3: Visual Elements =====');

    // Navigate back to dashboard for visual checks
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // FE-016-A: Check accent color blue #3B82F6
    // Check the sidebar active menu item or primary elements
    const accentColor = await page.evaluate(() => {
      const root = document.documentElement;
      return window.getComputedStyle(root).getPropertyValue('--color-primary').trim();
    });
    if (accentColor.toUpperCase() === '#3B82F6' || hexCloseTo(accentColor, '#3B82F6', 5)) {
      record('FE-016-A', 'Accent color is #3B82F6 (tech blue)', 'PASS', `--color-primary: ${accentColor}`);
    } else {
      record('FE-016-A', 'Accent color is #3B82F6 (tech blue)', 'FAIL', `--color-primary: ${accentColor}`);
    }

    // FE-016-B: Check card background #111827
    const cardBg = await page.evaluate(() => {
      const root = document.documentElement;
      return window.getComputedStyle(root).getPropertyValue('--color-bg-card').trim();
    });
    if (hexCloseTo(cardBg, '#111827', 5)) {
      record('FE-016-B', 'Card background is #111827', 'PASS', `--color-bg-card: ${cardBg}`);
    } else {
      // Check actual card element
      const cardEl = page.locator('.card').first();
      if (await cardEl.count() > 0) {
        const actualCardBg = await cardEl.evaluate(el => window.getComputedStyle(el).backgroundColor);
        if (hexCloseTo(actualCardBg, '#111827', 30)) {
          record('FE-016-B', 'Card background is #111827', 'PASS', `Card element background: ${actualCardBg}`);
        } else {
          record('FE-016-B', 'Card background is #111827', 'FAIL', `Variable: ${cardBg}, Actual: ${actualCardBg}`);
        }
      } else {
        record('FE-016-B', 'Card background is #111827', 'FAIL', `CSS variable: ${cardBg}`);
      }
    }

    // FE-016-C: Check sidebar styling (dark themed)
    const sidebarBg = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar') || document.querySelector('.el-aside');
      if (!sidebar) return 'NOT_FOUND';
      return window.getComputedStyle(sidebar).backgroundColor;
    });
    if (hexCloseTo(sidebarBg, '#111827', 30)) {
      record('FE-016-C', 'Sidebar has dark tech-themed styling (#111827)', 'PASS', `Sidebar background: ${sidebarBg}`);
    } else {
      record('FE-016-C', 'Sidebar has dark tech-themed styling (#111827)', 'FAIL', `Sidebar background: ${sidebarBg}`);
    }

    // FE-016-D: Check header styling
    const headerBg = await page.evaluate(() => {
      const header = document.querySelector('.header') || document.querySelector('.el-header');
      if (!header) return 'NOT_FOUND';
      return window.getComputedStyle(header).backgroundColor;
    });
    if (hexCloseTo(headerBg, '#111827', 30)) {
      record('FE-016-D', 'Header has dark themed styling (#111827)', 'PASS', `Header background: ${headerBg}`);
    } else {
      record('FE-016-D', 'Header has dark themed styling (#111827)', 'FAIL', `Header background: ${headerBg}`);
    }

    // FE-016-E: Check text colors are light (readable on dark bg)
    const textColor = await page.evaluate(() => {
      const root = document.documentElement;
      return window.getComputedStyle(root).getPropertyValue('--color-text-primary').trim();
    });
    // Should be a light color like #E5E7EB
    if (hexCloseTo(textColor, '#E5E7EB', 30)) {
      record('FE-016-E', 'Text primary color is light (#E5E7EB) for readability on dark bg', 'PASS', `--color-text-primary: ${textColor}`);
    } else {
      record('FE-016-E', 'Text primary color is light (#E5E7EB) for readability on dark bg', 'FAIL', `--color-text-primary: ${textColor}`);
    }

    // FE-016-F: Check border color for card separation
    const borderColor = await page.evaluate(() => {
      const root = document.documentElement;
      return window.getComputedStyle(root).getPropertyValue('--color-border-light').trim();
    });
    if (hexCloseTo(borderColor, '#1F2937', 10)) {
      record('FE-016-F', 'Card border color is dark (#1F2937)', 'PASS', `--color-border-light: ${borderColor}`);
    } else {
      record('FE-016-F', 'Card border color is dark (#1F2937)', 'FAIL', `--color-border-light: ${borderColor}`);
    }

    // FE-016-G: Check charts render with data (real-time data)
    const canvasElements = page.locator('canvas');
    const canvasElCount = await canvasElements.count();
    if (canvasElCount > 0) {
      // Check if canvas has actual content (not blank)
      const hasContent = await page.evaluate(() => {
        const canvases = document.querySelectorAll('canvas');
        for (const canvas of canvases) {
          const ctx = (canvas as HTMLCanvasElement).getContext('2d');
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
            // Check if there are any non-transparent/non-black pixels
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
      if (hasContent) {
        record('FE-016-G', 'Charts render with actual data (non-blank canvas)', 'PASS', `Found ${canvasElCount} canvas elements with content`);
      } else {
        record('FE-016-G', 'Charts render with actual data (non-blank canvas)', 'FAIL', `Found ${canvasElCount} canvas elements but they appear blank`);
      }
    } else {
      record('FE-016-G', 'Charts render with actual data (non-blank canvas)', 'FAIL', 'No canvas elements found');
    }

    // FE-016-H: Check font-family for tech feel (code/monospace fonts used)
    const codeFont = await page.evaluate(() => {
      const root = document.documentElement;
      return window.getComputedStyle(root).getPropertyValue('--font-family-code').trim();
    });
    if (codeFont.includes('Cascadia') || codeFont.includes('Fira') || codeFont.includes('monospace')) {
      record('FE-016-H', 'Code/number fonts use tech-themed monospace (Cascadia/Fira)', 'PASS', `--font-family-code: ${codeFont}`);
    } else {
      record('FE-016-H', 'Code/number fonts use tech-themed monospace (Cascadia/Fira)', 'FAIL', `--font-family-code: ${codeFont}`);
    }

    // ============================================================
    // TEST 4: Interactions
    // ============================================================
    console.log('\n===== TEST 4: Interactions =====');

    // FE-017-A: Click on a device card on dashboard
    const dashDeviceCards = page.locator('.device-card');
    if (await dashDeviceCards.count() > 0) {
      // Get the id of the device card before clicking
      const firstCardClassBefore = await dashDeviceCards.first().getAttribute('class');

      await dashDeviceCards.first().click();
      await page.waitForTimeout(500);

      // Check if it got the 'selected' class
      const firstCardClassAfter = await dashDeviceCards.first().getAttribute('class');
      const hasSelected = firstCardClassAfter?.includes('selected') ?? false;

      if (hasSelected) {
        record('FE-017-A', 'Clicking device card applies "selected" visual state', 'PASS', `Card class changed to include "selected"`);
      } else {
        record('FE-017-A', 'Clicking device card applies "selected" visual state', 'FAIL', `Before: "${firstCardClassBefore}", After: "${firstCardClassAfter}"`);
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-device-selected.png'), fullPage: false });
      console.log('Screenshot saved: 03-device-selected.png');
    } else {
      record('FE-017-A', 'Clicking device card applies "selected" visual state', 'FAIL', 'No device cards to click');
    }

    // FE-017-B: Try pause/resume button
    const pauseBtn = page.locator('button').filter({ hasText: '暂停' });
    if (await pauseBtn.count() > 0) {
      await pauseBtn.first().click();
      await page.waitForTimeout(500);

      // Check if button text changed to "继续"
      const resumeBtn = page.locator('button').filter({ hasText: '继续' });
      if (await resumeBtn.count() > 0) {
        record('FE-017-B', 'Pause button toggles to resume state', 'PASS', 'Button changed from "暂停" to "继续"');

        // Also check if LIVE indicator changed
        const liveIndicator = page.locator('.live-indicator');
        if (await liveIndicator.count() > 0) {
          const liveClass = await liveIndicator.getAttribute('class');
          if (liveClass?.includes('paused')) {
            record('FE-017-C', 'LIVE indicator shows paused state', 'PASS', `Class includes "paused": ${liveClass}`);
          } else {
            record('FE-017-C', 'LIVE indicator shows paused state', 'FAIL', `Class: ${liveClass}`);
          }
        } else {
          record('FE-017-C', 'LIVE indicator shows paused state', 'FAIL', 'No LIVE indicator found');
        }

        // Resume
        await resumeBtn.first().click();
        await page.waitForTimeout(500);
      } else {
        record('FE-017-B', 'Pause button toggles to resume state', 'FAIL', 'Button text did not change to "继续"');
        record('FE-017-C', 'LIVE indicator shows paused state', 'FAIL', 'Cannot check - pause toggle failed');
      }
    } else {
      record('FE-017-B', 'Pause button toggles to resume state', 'FAIL', 'No "暂停" button found');
      record('FE-017-C', 'LIVE indicator shows paused state', 'FAIL', 'No pause button to test');
    }

    // FE-017-D: Navigate to device page and try delete button (with dialog)
    await page.locator('.el-menu-item').filter({ hasText: '设备管理' }).click();
    await page.waitForTimeout(1500);

    const deleteBtn = page.locator('button').filter({ hasText: '删除' }).first();
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.waitForTimeout(500);

      // Check if confirmation dialog appeared
      const dialog = page.locator('.el-message-box, .el-dialog');
      if (await dialog.count() > 0) {
        const dialogText = await dialog.first().innerText();
        record('FE-017-D', 'Delete button triggers confirmation dialog', 'PASS', `Dialog text: "${dialogText.substring(0, 60)}..."`);

        // Cancel the dialog
        const cancelBtn = page.locator('.el-message-box__btns button').filter({ hasText: '取消' });
        if (await cancelBtn.count() > 0) {
          await cancelBtn.click();
        } else {
          // Press Escape to close
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(500);
      } else {
        record('FE-017-D', 'Delete button triggers confirmation dialog', 'FAIL', 'No dialog appeared after clicking delete');
      }
    } else {
      record('FE-017-D', 'Delete button triggers confirmation dialog', 'FAIL', 'No delete button found');
    }

    // FE-017-E: Try Add Device dialog
    const addDeviceBtn = page.locator('button').filter({ hasText: '添加设备' });
    if (await addDeviceBtn.count() > 0) {
      await addDeviceBtn.first().click();
      await page.waitForTimeout(500);

      const addDialog = page.locator('.el-dialog');
      if (await addDialog.count() > 0) {
        const isVisible = await addDialog.first().isVisible();
        if (isVisible) {
          record('FE-017-E', 'Add Device button opens dialog', 'PASS', 'Dialog is visible');

          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-add-device-dialog.png'), fullPage: false });
          console.log('Screenshot saved: 04-add-device-dialog.png');

          // Close it
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        } else {
          record('FE-017-E', 'Add Device button opens dialog', 'FAIL', 'Dialog exists but is not visible');
        }
      } else {
        record('FE-017-E', 'Add Device button opens dialog', 'FAIL', 'No dialog appeared');
      }
    } else {
      record('FE-017-E', 'Add Device button opens dialog', 'FAIL', 'No "添加设备" button found');
    }

    // FE-017-F: Check refresh interval selector on dashboard
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const refreshButtons = page.locator('.el-radio-button');
    if (await refreshButtons.count() > 0) {
      // Click 1s button
      const oneSecBtn = page.locator('.el-radio-button').filter({ hasText: '1s' });
      if (await oneSecBtn.count() > 0) {
        await oneSecBtn.first().click();
        await page.waitForTimeout(500);
        record('FE-017-F', 'Refresh interval selector works (clicked 1s)', 'PASS', `Found ${await refreshButtons.count()} interval options`);
      } else {
        record('FE-017-F', 'Refresh interval selector works (clicked 1s)', 'FAIL', 'No 1s button found among radio buttons');
      }
    } else {
      record('FE-017-F', 'Refresh interval selector works (clicked 1s)', 'FAIL', 'No radio buttons found');
    }

    // FE-017-G: Navigate all pages via sidebar
    const menuItems = ['仪表盘', '充电模拟', '设备管理', '场景编排', '日志终端'];
    let navSuccessCount = 0;
    for (const item of menuItems) {
      const menuItem = page.locator('.el-menu-item').filter({ hasText: item });
      if (await menuItem.count() > 0) {
        await menuItem.click();
        await page.waitForTimeout(1000);
        navSuccessCount++;
      }
    }
    if (navSuccessCount === menuItems.length) {
      record('FE-017-G', 'All sidebar navigation items work', 'PASS', `Navigated to ${navSuccessCount}/${menuItems.length} pages`);
    } else {
      record('FE-017-G', 'All sidebar navigation items work', 'FAIL', `Only navigated to ${navSuccessCount}/${menuItems.length} pages`);
    }

    // Take final screenshot of the last page
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-final-state.png'), fullPage: true });
    console.log('Screenshot saved: 05-final-state.png');

  } catch (err) {
    console.error('Test execution error:', err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-screenshot.png'), fullPage: true });
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
    console.log(`  [${r.status}] ${r.testId}: ${r.description}`);
    if (r.status === 'FAIL') {
      console.log(`         Details: ${r.details}`);
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log(`Total: ${total} | PASS: ${passed} | FAIL: ${failed} | Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  // Write results to JSON file
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'test-results.json'),
    JSON.stringify({ summary: { total, passed, failed, passRate: `${((passed / total) * 100).toFixed(1)}%` }, results }, null, 2)
  );
  console.log(`\nResults written to: ${path.join(SCREENSHOT_DIR, 'test-results.json')}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
}

runTests().catch(console.error);
