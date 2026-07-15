import { chromium, type Page, type Browser } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = join(process.cwd(), 'test-screenshots');

interface TestResult {
  scenario: string;
  page: string;
  check: string;
  found: string;
  result: 'PASS' | 'FAIL' | 'WARN';
}

const results: TestResult[] = [];
let browser: Browser;
let page: Page;

function record(scenario: string, pageName: string, check: string, found: string, result: 'PASS' | 'FAIL' | 'WARN') {
  results.push({ scenario, page: pageName, check, found, result });
  const icon = result === 'PASS' ? '[PASS]' : result === 'FAIL' ? '[FAIL]' : '[WARN]';
  console.log(`${icon} [${scenario}] ${check}: ${found}`);
}

async function screenshot(name: string) {
  if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const path = join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log(`  Screenshot saved: ${path}`);
  return path;
}

async function waitForPageReady(ms = 2000) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ms);
}

// ==================== TEST 1: LOGIN PAGE ====================
async function testLoginPage() {
  console.log('\n========================================');
  console.log('TEST 1: LOGIN PAGE');
  console.log('========================================');

  // Navigate to login page
  await page.goto(`${BASE_URL}/login`);
  await waitForPageReady();
  await screenshot('01-login-page');

  // Check login form exists
  const form = await page.locator('form.el-form, .el-form').first();
  const formExists = await form.isVisible().catch(() => false);
  record('Login', 'Login Page', 'Login form exists', formExists ? 'Form visible' : 'Form not found', formExists ? 'PASS' : 'FAIL');

  // Check title
  const title = await page.locator('h1').first().textContent().catch(() => '');
  record('Login', 'Login Page', 'Platform title shows EV charging', title || 'not found', title?.includes('EV充电') ? 'PASS' : 'FAIL');

  const subtitle = await page.locator('h2').first().textContent().catch(() => '');
  record('Login', 'Login Page', 'Subtitle shows admin system', subtitle || 'not found', subtitle?.includes('后台管理') ? 'PASS' : 'FAIL');

  // Check username/password fields
  const usernameInput = page.locator('input[placeholder*="用户名"]');
  const passwordInput = page.locator('input[placeholder*="密码"], input[type="password"]');
  const usernameExists = await usernameInput.isVisible().catch(() => false);
  const passwordExists = await passwordInput.isVisible().catch(() => false);
  record('Login', 'Login Page', 'Username input exists', usernameExists ? 'visible' : 'not found', usernameExists ? 'PASS' : 'FAIL');
  record('Login', 'Login Page', 'Password input exists', passwordExists ? 'visible' : 'not found', passwordExists ? 'PASS' : 'FAIL');

  // Check login button
  const loginBtn = page.locator('button:has-text("登录")');
  const btnExists = await loginBtn.isVisible().catch(() => false);
  record('Login', 'Login Page', 'Login button exists', btnExists ? 'visible' : 'not found', btnExists ? 'PASS' : 'FAIL');

  // Check demo credentials hint
  const hint = await page.locator('.login-hint, text=demo').first().textContent().catch(() => '');
  record('Login', 'Login Page', 'Demo credentials hint visible', hint || 'not found', hint?.includes('admin') ? 'PASS' : 'WARN');

  // Test: Submit empty form -> validation messages
  await loginBtn.click();
  await page.waitForTimeout(500);
  const validationMsgs = await page.locator('.el-form-item__error').allTextContents();
  record('Login', 'Login Page', 'Empty form validation messages', `${validationMsgs.length} messages: ${validationMsgs.join(', ')}`, validationMsgs.length > 0 ? 'PASS' : 'FAIL');
  await screenshot('01-login-empty-validation');

  // Test: Wrong password -> error message
  await usernameInput.fill('admin');
  await passwordInput.fill('wrongpass');
  await loginBtn.click();
  await page.waitForTimeout(1500);
  const errorMsg = await page.locator('.el-message--error, .el-notification').textContent().catch(() => '');
  record('Login', 'Login Page', 'Wrong password error message', errorMsg || 'no error shown', errorMsg ? 'PASS' : 'FAIL');
  await screenshot('01-login-wrong-password');

  // Test: Correct login -> redirect to dashboard
  await usernameInput.fill('admin');
  await passwordInput.fill('admin123');
  await loginBtn.click();
  await page.waitForTimeout(3000);
  const currentUrl = page.url();
  record('Login', 'Login Page', 'Successful login redirects to dashboard', `URL: ${currentUrl}`, currentUrl.includes('/dashboard') ? 'PASS' : 'FAIL');
  await screenshot('01-login-success-redirect');

  // Check success message
  const successMsg = await page.locator('.el-message--success').textContent().catch(() => '');
  record('Login', 'Login Page', 'Success message shown', successMsg || 'not captured (may have faded)', successMsg?.includes('登录成功') ? 'PASS' : 'WARN');
}

// ==================== TEST 2: DASHBOARD PAGE ====================
async function testDashboardPage() {
  console.log('\n========================================');
  console.log('TEST 2: DASHBOARD PAGE');
  console.log('========================================');

  // Already on dashboard from login redirect
  await waitForPageReady(3000);
  await screenshot('02-dashboard-overview');

  // Check 6 statistic cards
  const statsCards = page.locator('.stats-grid > *, .stat-card, [class*="stat"]');
  const cardCount = await statsCards.count();
  record('Dashboard', 'Dashboard', 'Statistic cards count', `Found ${cardCount} cards`, cardCount >= 6 ? 'PASS' : cardCount > 0 ? 'WARN' : 'FAIL');

  // Check KPI card titles
  const expectedTitles = ['今日充电量', '今日营收', '今日订单数', '活跃用户数', '设备在线率', '设备利用率'];
  for (const title of expectedTitles) {
    const found = await page.locator(`text=${title}`).isVisible().catch(() => false);
    record('Dashboard', 'Dashboard', `KPI card "${title}" visible`, found ? 'visible' : 'not found', found ? 'PASS' : 'FAIL');
  }

  // Check for NaN, undefined, null displayed as text
  const bodyText = await page.locator('.dashboard, .main-layout').textContent().catch(() => '');
  const hasNaN = bodyText.includes('NaN');
  const hasUndefined = bodyText.includes('undefined');
  const hasNullText = bodyText.includes('null');
  record('Dashboard', 'Dashboard', 'No NaN displayed', hasNaN ? 'NaN found!' : 'Clean', !hasNaN ? 'PASS' : 'FAIL');
  record('Dashboard', 'Dashboard', 'No "undefined" displayed', hasUndefined ? 'undefined found!' : 'Clean', !hasUndefined ? 'PASS' : 'FAIL');
  record('Dashboard', 'Dashboard', 'No "null" displayed', hasNullText ? 'null found!' : 'Clean', !hasNullText ? 'PASS' : 'FAIL');

  // Check amount formatting (should show ¥ symbol)
  const yuanSymbol = await page.locator('text=/¥/').count();
  record('Dashboard', 'Dashboard', 'Yuan symbol (¥) present', `Found ${yuanSymbol} instances`, yuanSymbol > 0 ? 'PASS' : 'FAIL');

  // Check energy formatting (should show kWh)
  const kwhText = await page.locator('text=/kWh/').count();
  record('Dashboard', 'Dashboard', 'kWh unit present', `Found ${kwhText} instances`, kwhText > 0 ? 'PASS' : 'FAIL');

  // Check charts render (canvas elements for ECharts)
  const canvasElements = await page.locator('canvas').count();
  const chartContainers = await page.locator('.echarts, [_echarts_instance_]').count();
  const vChartElements = await page.locator('[_echarts_instance_]').count();
  record('Dashboard', 'Dashboard', 'Charts rendered (canvas)', `Found ${canvasElements} canvas elements`, canvasElements > 0 ? 'PASS' : 'FAIL');

  // Check recent orders table
  const ordersTable = page.locator('.el-table');
  const tableVisible = await ordersTable.first().isVisible().catch(() => false);
  record('Dashboard', 'Dashboard', 'Recent orders table visible', tableVisible ? 'visible' : 'not found', tableVisible ? 'PASS' : 'FAIL');

  // Check order rows
  const tableRows = await page.locator('.el-table__body-wrapper .el-table__row').count();
  record('Dashboard', 'Dashboard', 'Recent orders have data rows', `Found ${tableRows} rows`, tableRows > 0 ? 'PASS' : 'FAIL');

  // Check order status tags
  const statusTags = await page.locator('.el-table .el-tag').count();
  record('Dashboard', 'Dashboard', 'Order status tags shown', `Found ${statusTags} tags`, statusTags > 0 ? 'PASS' : 'WARN');

  // Check revenue chart header
  const revenueChartHeader = await page.locator('text=营收趋势').isVisible().catch(() => false);
  record('Dashboard', 'Dashboard', 'Revenue chart header visible', revenueChartHeader ? 'visible' : 'not found', revenueChartHeader ? 'PASS' : 'FAIL');

  // Check station rank chart
  const rankHeader = await page.locator('text=站点营收排行').isVisible().catch(() => false);
  record('Dashboard', 'Dashboard', 'Station rank chart visible', rankHeader ? 'visible' : 'not found', rankHeader ? 'PASS' : 'FAIL');

  // Check todo items
  const todoHeader = await page.locator('text=待办事项').isVisible().catch(() => false);
  record('Dashboard', 'Dashboard', 'Todo items section visible', todoHeader ? 'visible' : 'not found', todoHeader ? 'PASS' : 'FAIL');

  await screenshot('02-dashboard-final');
}

// ==================== TEST 3: STATION MANAGEMENT ====================
async function testStationManagement() {
  console.log('\n========================================');
  console.log('TEST 3: STATION MANAGEMENT');
  console.log('========================================');

  await page.goto(`${BASE_URL}/station`);
  await waitForPageReady(3000);
  await screenshot('03-station-page');

  // Check search bar exists
  const searchInput = page.locator('input[placeholder*="名称"], input[placeholder*="编号"]');
  const searchExists = await searchInput.isVisible().catch(() => false);
  record('Station', 'Station Page', 'Search bar exists', searchExists ? 'visible' : 'not found', searchExists ? 'PASS' : 'FAIL');

  // Check status filter
  const statusSelect = page.locator('.el-select').first();
  const statusSelectExists = await statusSelect.isVisible().catch(() => false);
  record('Station', 'Station Page', 'Status filter exists', statusSelectExists ? 'visible' : 'not found', statusSelectExists ? 'PASS' : 'FAIL');

  // Check search/reset/add buttons
  const searchBtn = page.locator('button:has-text("搜索")');
  const resetBtn = page.locator('button:has-text("重置")');
  const addBtn = page.locator('button:has-text("新增充电站")');
  const searchBtnExists = await searchBtn.isVisible().catch(() => false);
  const resetBtnExists = await resetBtn.isVisible().catch(() => false);
  const addBtnExists = await addBtn.isVisible().catch(() => false);
  record('Station', 'Station Page', 'Search button exists', searchBtnExists ? 'visible' : 'not found', searchBtnExists ? 'PASS' : 'FAIL');
  record('Station', 'Station Page', 'Reset button exists', resetBtnExists ? 'visible' : 'not found', resetBtnExists ? 'PASS' : 'FAIL');
  record('Station', 'Station Page', 'Add station button exists', addBtnExists ? 'visible' : 'not found', addBtnExists ? 'PASS' : 'FAIL');

  // Check table with data rows
  const tableRows = await page.locator('.el-table__body-wrapper .el-table__row').count();
  record('Station', 'Station Page', 'Table has data rows', `Found ${tableRows} rows`, tableRows > 0 ? 'PASS' : 'FAIL');

  // Check table headers
  const expectedHeaders = ['编号', '充电站名称', '地址', '设备', '综合电价', '状态', '操作'];
  for (const header of expectedHeaders) {
    const found = await page.locator(`th:has-text("${header}")`).isVisible().catch(() => false);
    record('Station', 'Station Page', `Table header "${header}"`, found ? 'visible' : 'not found', found ? 'PASS' : 'FAIL');
  }

  // Check pagination
  const pagination = page.locator('.el-pagination');
  const paginationExists = await pagination.isVisible().catch(() => false);
  record('Station', 'Station Page', 'Pagination exists', paginationExists ? 'visible' : 'not found', paginationExists ? 'PASS' : 'FAIL');

  // Check action buttons in table
  const detailBtns = await page.locator('button:has-text("详情")').count();
  const editBtns = await page.locator('button:has-text("编辑")').count();
  record('Station', 'Station Page', 'Detail action buttons', `Found ${detailBtns}`, detailBtns > 0 ? 'PASS' : 'FAIL');
  record('Station', 'Station Page', 'Edit action buttons', `Found ${editBtns}`, editBtns > 0 ? 'PASS' : 'FAIL');

  // Click add button -> verify create form
  await addBtn.click();
  await page.waitForTimeout(1000);
  await screenshot('03-station-create-form');

  const dialogTitle = await page.locator('.el-dialog__title').textContent().catch(() => '');
  record('Station', 'Create Dialog', 'Create dialog opens', dialogTitle || 'not found', dialogTitle?.includes('新增') ? 'PASS' : 'FAIL');

  // Verify form fields exist in dialog
  const nameField = page.locator('.el-dialog input[placeholder*="名称"]');
  const codeField = page.locator('.el-dialog input[placeholder*="BJ"]');
  const nameFieldExists = await nameField.isVisible().catch(() => false);
  const codeFieldExists = await codeField.isVisible().catch(() => false);
  record('Station', 'Create Dialog', 'Name field exists', nameFieldExists ? 'visible' : 'not found', nameFieldExists ? 'PASS' : 'FAIL');
  record('Station', 'Create Dialog', 'Code field exists', codeFieldExists ? 'visible' : 'not found', codeFieldExists ? 'PASS' : 'FAIL');

  // Try submitting empty form -> validation errors
  const submitBtn = page.locator('.el-dialog button:has-text("创建")');
  await submitBtn.click();
  await page.waitForTimeout(800);
  const dialogErrors = await page.locator('.el-dialog .el-form-item__error').allTextContents();
  record('Station', 'Create Dialog', 'Empty form validation errors', `${dialogErrors.length} errors: ${dialogErrors.join(', ').substring(0, 150)}`, dialogErrors.length > 0 ? 'PASS' : 'FAIL');
  await screenshot('03-station-validation-errors');

  // Close dialog
  const cancelBtn = page.locator('.el-dialog button:has-text("取消")');
  await cancelBtn.click();
  await page.waitForTimeout(500);
  const dialogClosed = !(await page.locator('.el-dialog:visible').isVisible().catch(() => false));
  record('Station', 'Create Dialog', 'Dialog closes on cancel', dialogClosed ? 'closed' : 'still open', dialogClosed ? 'PASS' : 'FAIL');

  // Test search functionality
  await searchInput.fill('北京');
  await searchBtn.click();
  await waitForPageReady(2000);
  const filteredRows = await page.locator('.el-table__body-wrapper .el-table__row').count();
  record('Station', 'Station Page', 'Search filters results (keyword: 北京)', `Found ${filteredRows} rows after search`, filteredRows >= 1 && filteredRows < tableRows ? 'PASS' : filteredRows === tableRows ? 'WARN' : 'PASS');
  await screenshot('03-station-search-result');

  // Reset search
  await resetBtn.click();
  await waitForPageReady(2000);
  const resetRows = await page.locator('.el-table__body-wrapper .el-table__row').count();
  record('Station', 'Station Page', 'Reset restores all results', `Found ${resetRows} rows after reset`, resetRows >= filteredRows ? 'PASS' : 'FAIL');
}

// ==================== TEST 4: DEVICE MANAGEMENT ====================
async function testDeviceManagement() {
  console.log('\n========================================');
  console.log('TEST 4: DEVICE MANAGEMENT');
  console.log('========================================');

  await page.goto(`${BASE_URL}/device`);
  await waitForPageReady(3000);
  await screenshot('04-device-page');

  // Check device list loads with data
  const tableRows = await page.locator('.el-table__body-wrapper .el-table__row').count();
  record('Device', 'Device Page', 'Device list has data rows', `Found ${tableRows} rows`, tableRows > 0 ? 'PASS' : 'FAIL');

  // Check device-specific columns
  const expectedHeaders = ['设备编号', '所属充电站', '型号', '类型', '额定功率', '状态'];
  for (const header of expectedHeaders) {
    const found = await page.locator(`th:has-text("${header}")`).isVisible().catch(() => false);
    record('Device', 'Device Page', `Table header "${header}"`, found ? 'visible' : 'not found', found ? 'PASS' : 'FAIL');
  }

  // Check device status tags
  const statusTags = await page.locator('.el-table .el-tag').count();
  record('Device', 'Device Page', 'Device status tags visible', `Found ${statusTags} tags`, statusTags > 0 ? 'PASS' : 'FAIL');

  // Check power display (kW)
  const kwDisplay = await page.locator('text=/kW/').count();
  record('Device', 'Device Page', 'Power unit (kW) displayed', `Found ${kwDisplay} instances`, kwDisplay > 0 ? 'PASS' : 'FAIL');

  // Check connector status display
  const connectorItems = await page.locator('.connector-item').count();
  record('Device', 'Device Page', 'Connector status displayed', `Found ${connectorItems} connector items`, connectorItems > 0 ? 'PASS' : 'FAIL');

  // Check pagination
  const pagination = page.locator('.el-pagination');
  const paginationExists = await pagination.isVisible().catch(() => false);
  record('Device', 'Device Page', 'Pagination exists', paginationExists ? 'visible' : 'not found', paginationExists ? 'PASS' : 'FAIL');

  // Check search/filter controls
  const searchBtn = page.locator('button:has-text("搜索")');
  const searchExists = await searchBtn.isVisible().catch(() => false);
  record('Device', 'Device Page', 'Search button exists', searchExists ? 'visible' : 'not found', searchExists ? 'PASS' : 'FAIL');

  // Check detail/reset buttons
  const detailBtns = await page.locator('button:has-text("详情")').count();
  record('Device', 'Device Page', 'Detail action buttons', `Found ${detailBtns}`, detailBtns > 0 ? 'PASS' : 'FAIL');
}

// ==================== TEST 5: ORDER CENTER ====================
async function testOrderCenter() {
  console.log('\n========================================');
  console.log('TEST 5: ORDER CENTER');
  console.log('========================================');

  await page.goto(`${BASE_URL}/order`);
  await waitForPageReady(3000);
  await screenshot('05-order-page');

  // Check order table with pagination
  const tableRows = await page.locator('.el-table__body-wrapper .el-table__row').count();
  record('Order', 'Order Page', 'Order table has data rows', `Found ${tableRows} rows`, tableRows > 0 ? 'PASS' : 'FAIL');

  const pagination = page.locator('.el-pagination');
  const paginationExists = await pagination.isVisible().catch(() => false);
  record('Order', 'Order Page', 'Pagination exists', paginationExists ? 'visible' : 'not found', paginationExists ? 'PASS' : 'FAIL');

  // Check order status tags have colors (check for el-tag with different types)
  const tagTypes = await page.locator('.el-table .el-tag').evaluateAll((tags) => {
    return tags.map(tag => ({
      text: tag.textContent?.trim(),
      classes: tag.className,
    }));
  });
  record('Order', 'Order Page', 'Order status tags', `Found ${tagTypes.length} tags: ${tagTypes.map(t => t.text).join(', ')}`, tagTypes.length > 0 ? 'PASS' : 'FAIL');

  // Check amount formatting
  const amounts = await page.locator('.amount, text=/¥/').allTextContents();
  const hasYuan = amounts.some(a => a.includes('¥'));
  record('Order', 'Order Page', 'Amount shows ¥ symbol', `Found ${amounts.length} amount displays`, hasYuan ? 'PASS' : 'FAIL');

  // Check energy formatting
  const energyCells = await page.locator('text=/kWh/').count();
  record('Order', 'Order Page', 'Energy shows kWh unit', `Found ${energyCells} instances`, energyCells > 0 ? 'PASS' : 'FAIL');

  // Check order-specific columns
  const expectedHeaders = ['订单号', '用户', '充电站', '设备', '电量', '金额', '状态'];
  for (const header of expectedHeaders) {
    const found = await page.locator(`th:has-text("${header}")`).isVisible().catch(() => false);
    record('Order', 'Order Page', `Table header "${header}"`, found ? 'visible' : 'not found', found ? 'PASS' : 'FAIL');
  }

  // Try changing page size
  const pageSizeSelector = page.locator('.el-pagination .el-select, .el-pagination .el-pagination__sizes').first();
  const sizeSelectorExists = await pageSizeSelector.isVisible().catch(() => false);
  record('Order', 'Order Page', 'Page size selector exists', sizeSelectorExists ? 'visible' : 'not found', sizeSelectorExists ? 'PASS' : 'FAIL');

  if (sizeSelectorExists) {
    await pageSizeSelector.click();
    await page.waitForTimeout(500);
    const sizeOptions = await page.locator('.el-select-dropdown .el-select-dropdown__item').count();
    record('Order', 'Order Page', 'Page size options available', `Found ${sizeOptions} options`, sizeOptions > 0 ? 'PASS' : 'FAIL');
    // Close dropdown by pressing escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // Try searching by order number
  const orderNoInput = page.locator('input[placeholder*="订单号"]');
  const orderNoExists = await orderNoInput.isVisible().catch(() => false);
  record('Order', 'Order Page', 'Order number search input exists', orderNoExists ? 'visible' : 'not found', orderNoExists ? 'PASS' : 'FAIL');

  if (orderNoExists) {
    await orderNoInput.fill('ORD-20260713');
    const searchBtn = page.locator('button:has-text("搜索")');
    await searchBtn.click();
    await waitForPageReady(2000);
    const filteredRows = await page.locator('.el-table__body-wrapper .el-table__row').count();
    record('Order', 'Order Page', 'Search filters by order number', `Found ${filteredRows} rows`, filteredRows >= 1 ? 'PASS' : 'FAIL');
    await screenshot('05-order-search-result');
  }

  // Check status filter
  const statusFilter = page.locator('.el-select').nth(1);
  const statusFilterExists = await statusFilter.isVisible().catch(() => false);
  record('Order', 'Order Page', 'Status filter dropdown exists', statusFilterExists ? 'visible' : 'not found', statusFilterExists ? 'PASS' : 'FAIL');
}

// ==================== TEST 6: FINANCE MANAGEMENT ====================
async function testFinanceManagement() {
  console.log('\n========================================');
  console.log('TEST 6: FINANCE MANAGEMENT');
  console.log('========================================');

  await page.goto(`${BASE_URL}/finance`);
  await waitForPageReady(3000);
  await screenshot('06-finance-page');

  // Check summary cards
  const summaryCards = page.locator('.summary-grid .el-card, .summary-grid > *');
  const cardCount = await summaryCards.count();
  record('Finance', 'Finance Page', 'Summary cards count', `Found ${cardCount} cards`, cardCount >= 5 ? 'PASS' : cardCount > 0 ? 'WARN' : 'FAIL');

  // Check summary values have ¥
  const summaryValues = await page.locator('.summary-value').allTextContents();
  const allHaveYuan = summaryValues.every(v => v.includes('¥'));
  record('Finance', 'Finance Page', 'Summary values show ¥ symbol', `Values: ${summaryValues.join(', ').substring(0, 100)}`, allHaveYuan ? 'PASS' : 'FAIL');

  // Check specific summary labels
  const expectedLabels = ['总收入', '本月收入', '今日收入', '待结算', '已退款'];
  for (const label of expectedLabels) {
    const found = await page.locator(`text=${label}`).isVisible().catch(() => false);
    record('Finance', 'Finance Page', `Summary label "${label}"`, found ? 'visible' : 'not found', found ? 'PASS' : 'FAIL');
  }

  // Check revenue chart
  const canvasCount = await page.locator('canvas').count();
  record('Finance', 'Finance Page', 'Finance charts rendered (canvas)', `Found ${canvasCount} canvas elements`, canvasCount > 0 ? 'PASS' : 'FAIL');

  // Check fund flow table
  const flowTable = page.locator('.el-table').first();
  const flowTableVisible = await flowTable.isVisible().catch(() => false);
  record('Finance', 'Finance Page', 'Fund flow table visible', flowTableVisible ? 'visible' : 'not found', flowTableVisible ? 'PASS' : 'FAIL');

  const flowRows = await page.locator('.el-table__body-wrapper .el-table__row').count();
  record('Finance', 'Finance Page', 'Fund flow table has rows', `Found ${flowRows} rows`, flowRows > 0 ? 'PASS' : 'FAIL');

  // Check status tags in finance table
  const finStatusTags = await page.locator('.el-table .el-tag').count();
  record('Finance', 'Finance Page', 'Finance status tags', `Found ${finStatusTags} tags`, finStatusTags > 0 ? 'PASS' : 'FAIL');

  // Check export button
  const exportBtn = await page.locator('button:has-text("导出")').count();
  record('Finance', 'Finance Page', 'Export button exists', `Found ${exportBtn}`, exportBtn > 0 ? 'PASS' : 'FAIL');
}

// ==================== TEST 7: NAVIGATION & UX ====================
async function testNavigation() {
  console.log('\n========================================');
  console.log('TEST 7: NAVIGATION & UX');
  console.log('========================================');

  const menuItems = [
    { path: '/dashboard', title: '工作台' },
    { path: '/station', title: '站点管理' },
    { path: '/device', title: '设备管理' },
    { path: '/order', title: '订单中心' },
    { path: '/finance', title: '财务管理' },
    { path: '/user', title: '用户管理' },
    { path: '/marketing', title: '营销中心' },
    { path: '/pricing', title: '电价管理' },
    { path: '/alert', title: '告警中心' },
    { path: '/ops', title: '运维管理' },
    { path: '/analytics', title: '数据分析' },
    { path: '/system', title: '系统管理' },
  ];

  for (const item of menuItems) {
    // Click sidebar menu item
    const menuItem = page.locator(`.el-menu-item:has-text("${item.title}")`);
    const menuExists = await menuItem.isVisible().catch(() => false);

    if (menuExists) {
      await menuItem.click();
      await waitForPageReady(2000);

      // Check page loads without white screen (has content)
      const mainContent = page.locator('.el-main, .layout-main');
      const contentText = await mainContent.textContent().catch(() => '');
      const hasContent = contentText && contentText.trim().length > 10;
      record('Navigation', item.title, 'Page loads without white screen', hasContent ? `Content loaded (${contentText.trim().substring(0, 50)}...)` : 'WHITE SCREEN or empty', hasContent ? 'PASS' : 'FAIL');

      // Check active menu highlighting
      const activeClass = await menuItem.evaluate(el => el.classList.contains('is-active'));
      record('Navigation', item.title, 'Active menu highlighting', activeClass ? 'highlighted' : 'not highlighted', activeClass ? 'PASS' : 'WARN');

      // Check URL matches
      const currentUrl = page.url();
      const urlCorrect = currentUrl.includes(item.path);
      record('Navigation', item.title, 'URL correct', `URL: ${currentUrl}`, urlCorrect ? 'PASS' : 'FAIL');

      await screenshot(`07-nav-${item.path.replace('/', '')}`);
    } else {
      record('Navigation', item.title, 'Menu item visible for admin role', 'not found in sidebar', 'FAIL');
    }
  }

  // Check breadcrumb / tab bar navigation
  const tabBar = page.locator('.layout-tabs, .el-tabs');
  const tabBarExists = await tabBar.isVisible().catch(() => false);
  record('Navigation', 'Global', 'Tab bar / breadcrumb exists', tabBarExists ? 'visible' : 'not found', tabBarExists ? 'PASS' : 'WARN');
}

// ==================== TEST 8: VISUAL CONSISTENCY ====================
async function testVisualConsistency() {
  console.log('\n========================================');
  console.log('TEST 8: VISUAL CONSISTENCY');
  console.log('========================================');

  // Navigate to dashboard for visual checks
  await page.goto(`${BASE_URL}/dashboard`);
  await waitForPageReady(3000);

  // Check brand color #1677FF is present
  const brandColor = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const colors = [style.color, style.backgroundColor, style.borderColor, style.borderLeftColor];
      for (const c of colors) {
        if (c && (c.includes('22, 119, 255') || c.includes('#1677ff') || c.includes('rgb(22, 119, 255)'))) {
          return true;
        }
      }
    }
    return false;
  });
  record('Visual', 'Dashboard', 'Brand color #1677FF present', brandColor ? 'found' : 'not found', brandColor ? 'PASS' : 'FAIL');

  // Check background color #F0F2F5
  const bgColor = await page.evaluate(() => {
    const main = document.querySelector('.el-main, .layout-main');
    if (main) {
      const style = window.getComputedStyle(main);
      return style.backgroundColor;
    }
    return '';
  });
  record('Visual', 'Dashboard', 'Main background color #F0F2F5', bgColor || 'not found', (bgColor.includes('240, 242, 245') || bgColor.includes('#f0f2f5')) ? 'PASS' : 'WARN');

  // Check sidebar dark background
  const sidebarBg = await page.evaluate(() => {
    const sidebar = document.querySelector('.el-aside, .layout-aside, .sidebar');
    if (sidebar) {
      const style = window.getComputedStyle(sidebar);
      return style.backgroundColor;
    }
    return '';
  });
  record('Visual', 'Dashboard', 'Sidebar dark background', sidebarBg || 'not found', sidebarBg.includes('0, 21, 41') ? 'PASS' : 'WARN');

  // Check consistent button styles (primary buttons use brand color)
  const primaryBtns = await page.locator('.el-button--primary').count();
  record('Visual', 'Dashboard', 'Primary buttons styled', `Found ${primaryBtns} primary buttons`, primaryBtns > 0 ? 'PASS' : 'FAIL');

  // Check table header styles
  const tableHeader = await page.evaluate(() => {
    const th = document.querySelector('.el-table th');
    if (th) {
      const style = window.getComputedStyle(th);
      return { bg: style.backgroundColor, color: style.color };
    }
    return null;
  });
  record('Visual', 'Dashboard', 'Table header styled', tableHeader ? `bg: ${tableHeader.bg}` : 'not found', tableHeader ? 'PASS' : 'WARN');

  // Check pagination exists and styled
  const paginationExists = await page.locator('.el-pagination').isVisible().catch(() => false);
  record('Visual', 'Dashboard', 'Pagination component styled', paginationExists ? 'visible' : 'not found', paginationExists ? 'PASS' : 'WARN');

  await screenshot('08-visual-consistency');
}

// ==================== TEST 9: ERROR HANDLING ====================
async function testErrorHandling() {
  console.log('\n========================================');
  console.log('TEST 9: ERROR HANDLING');
  console.log('========================================');

  // Navigate to non-existent URL
  await page.goto(`${BASE_URL}/nonexistent`);
  await waitForPageReady(2000);
  await screenshot('09-404-page');

  const currentUrl = page.url();
  const bodyText = await page.locator('body').textContent().catch(() => '');

  // Check if redirected to login, shows 404, or shows 403
  const isLoginPage = currentUrl.includes('/login');
  const is403Page = bodyText.includes('403') || bodyText.includes('权限');
  const is404Page = bodyText.includes('404') || bodyText.includes('不存在') || bodyText.includes('找不到');
  const hasChineseError = bodyText.includes('抱歉') || bodyText.includes('权限') || bodyText.includes('页面') || bodyText.includes('登录');

  record('Error', 'Non-existent URL', 'Handles unknown routes',
    isLoginPage ? 'Redirected to login' : is403Page ? 'Shows 403 page' : is404Page ? 'Shows 404 page' : `URL: ${currentUrl}`,
    (isLoginPage || is403Page || is404Page) ? 'PASS' : 'FAIL');

  if (!isLoginPage) {
    record('Error', 'Error Page', 'Error text in Chinese', hasChineseError ? 'Chinese text found' : 'No Chinese error text', hasChineseError ? 'PASS' : 'FAIL');
  }

  // Try the 403 page explicitly
  await page.goto(`${BASE_URL}/403`);
  await waitForPageReady(2000);
  await screenshot('09-403-page');

  const page403Text = await page.locator('body').textContent().catch(() => '');
  const has403Content = page403Text.includes('403') || page403Text.includes('权限');
  record('Error', '403 Page', '403 page renders correctly', has403Content ? 'Shows 403 content' : 'No 403 content', has403Content ? 'PASS' : 'FAIL');

  const has403Chinese = page403Text.includes('抱歉') || page403Text.includes('权限');
  record('Error', '403 Page', 'Error messages in Chinese', has403Chinese ? 'Chinese error text found' : 'Not in Chinese', has403Chinese ? 'PASS' : 'FAIL');

  // Check 403 page has return button
  const returnBtn = page.locator('button:has-text("返回")');
  const returnBtnExists = await returnBtn.first().isVisible().catch(() => false);
  record('Error', '403 Page', 'Return button exists', returnBtnExists ? 'visible' : 'not found', returnBtnExists ? 'PASS' : 'FAIL');

  // Test auth guard: clear token and try accessing protected route
  await page.evaluate(() => {
    localStorage.removeItem('admin_token');
  });
  await page.goto(`${BASE_URL}/dashboard`);
  await waitForPageReady(2000);
  await screenshot('09-auth-guard');

  const afterClearUrl = page.url();
  const redirectedToLogin = afterClearUrl.includes('/login');
  record('Error', 'Auth Guard', 'Unauthenticated access redirects to login', `URL: ${afterClearUrl}`, redirectedToLogin ? 'PASS' : 'FAIL');
}

// ==================== MAIN EXECUTION ====================
async function main() {
  console.log('================================================');
  console.log('  COMPREHENSIVE ADMIN-WEB UI TEST SUITE');
  console.log('  Target: http://localhost:5173');
  console.log('  Started: ' + new Date().toISOString());
  console.log('================================================');

  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'zh-CN',
  });
  page = await context.newPage();

  // Log console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await testLoginPage();
    await testDashboardPage();
    await testStationManagement();
    await testDeviceManagement();
    await testOrderCenter();
    await testFinanceManagement();
    await testNavigation();
    await testVisualConsistency();
    await testErrorHandling();
  } catch (error) {
    console.error('\n!!! CRITICAL TEST FAILURE !!!');
    console.error(error);
    await screenshot('ERROR-critical-failure').catch(() => {});
  }

  await browser.close();

  // Print summary
  console.log('\n================================================');
  console.log('  TEST RESULTS SUMMARY');
  console.log('================================================');

  const pass = results.filter(r => r.result === 'PASS').length;
  const fail = results.filter(r => r.result === 'FAIL').length;
  const warn = results.filter(r => r.result === 'WARN').length;
  const total = results.length;

  console.log(`Total: ${total} | PASS: ${pass} | FAIL: ${fail} | WARN: ${warn}`);
  console.log(`Pass Rate: ${((pass / total) * 100).toFixed(1)}%`);

  if (fail > 0) {
    console.log('\n--- FAILED TESTS ---');
    results.filter(r => r.result === 'FAIL').forEach(r => {
      console.log(`  [${r.scenario}] ${r.page} > ${r.check}: ${r.found}`);
    });
  }

  if (warn > 0) {
    console.log('\n--- WARNINGS ---');
    results.filter(r => r.result === 'WARN').forEach(r => {
      console.log(`  [${r.scenario}] ${r.page} > ${r.check}: ${r.found}`);
    });
  }

  console.log('\n--- ALL RESULTS ---');
  console.log('| Scenario | Page | Check | Found | Result |');
  console.log('|----------|------|-------|-------|--------|');
  results.forEach(r => {
    console.log(`| ${r.scenario} | ${r.page} | ${r.check} | ${r.found.substring(0, 60)} | ${r.result} |`);
  });

  if (consoleErrors.length > 0) {
    console.log('\n--- CONSOLE ERRORS CAPTURED ---');
    consoleErrors.slice(0, 10).forEach(e => console.log(`  ${e.substring(0, 200)}`));
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('================================================');

  // Exit with non-zero if there are failures
  if (fail > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
