import { test, expect } from '@playwright/test'

// ── Mock data for admin-web API endpoints ──────────────────────────────────────
const MOCK_DASHBOARD_STATS = {
  stationCount: 12,
  deviceCount: 48,
  onlineDeviceCount: 45,
  todayOrderCount: 156,
  todayRevenue: 3286500,
  monthRevenue: 9876543,
  totalEnergy: 123456000,
  todayEnergy: 8923400,
}

const MOCK_STATIONS = {
  list: [
    { id: 'S001', name: '国贸中心充电站', code: 'GM-001', address: '北京市朝阳区建国门外大街1号', status: 'ACTIVE', deviceCount: 12, onlineCount: 11 },
    { id: 'S002', name: '望京SOHO充电站', code: 'WJ-001', address: '北京市朝阳区望京街10号', status: 'ACTIVE', deviceCount: 8, onlineCount: 8 },
    { id: 'S003', name: '中关村科技园充电站', code: 'ZGC-001', address: '北京市海淀区中关村大街1号', status: 'MAINTENANCE', deviceCount: 15, onlineCount: 10 },
  ],
  total: 3, page: 1, size: 20,
}

const MOCK_DEVICES = {
  list: [
    { id: 'D001', stationId: 'S001', stationName: '国贸中心充电站', code: 'DC-001', ocppId: 'OCPP-GM-001', type: 'DC', power: 120, status: 'ONLINE' },
    { id: 'D002', stationId: 'S001', stationName: '国贸中心充电站', code: 'DC-002', ocppId: 'OCPP-GM-002', type: 'DC', power: 120, status: 'CHARGING' },
    { id: 'D003', stationId: 'S002', stationName: '望京SOHO充电站', code: 'AC-001', ocppId: 'OCPP-WJ-001', type: 'AC', power: 7, status: 'ONLINE' },
  ],
  total: 3, page: 1, size: 20,
}

const MOCK_ORDERS = {
  list: [
    { id: 'O001', orderNo: 'ORD20240701001', userName: '张三', stationName: '国贸中心充电站', status: 'PAID', consumedEnergy: 45.6, totalAmount: 82.08, startTime: '2024-07-01T10:00:00' },
    { id: 'O002', orderNo: 'ORD20240701002', userName: '李四', stationName: '望京SOHO充电站', status: 'CHARGING', consumedEnergy: 12.3, totalAmount: 22.14, startTime: '2024-07-01T11:30:00' },
    { id: 'O003', orderNo: 'ORD20240701003', userName: '王五', stationName: '国贸中心充电站', status: 'PAID', consumedEnergy: 30.0, totalAmount: 54.00, startTime: '2024-07-01T14:00:00' },
  ],
  total: 3, page: 1, size: 20,
}

const MOCK_RECENT_ORDERS = [
  { id: 'O001', orderNo: 'ORD20240701001', userName: '张三', stationName: '国贸中心充电站', status: 'PAID', consumedEnergy: 45.6, totalAmount: 82.08, startTime: '2024-07-01T10:00:00' },
  { id: 'O002', orderNo: 'ORD20240701002', userName: '李四', stationName: '望京SOHO充电站', status: 'CHARGING', consumedEnergy: 12.3, totalAmount: 22.14, startTime: '2024-07-01T11:30:00' },
  { id: 'O003', orderNo: 'ORD20240701003', userName: '王五', stationName: '国贸中心充电站', status: 'PAID', consumedEnergy: 30.0, totalAmount: 54.00, startTime: '2024-07-01T14:00:00' },
]

// ── Setup mock routes for admin-web ────────────────────────────────────────────
async function setupAdminMockRoutes(page: any, apiData: Record<string, any> = {}) {
  const data = { dashboardStats: MOCK_DASHBOARD_STATS, ...apiData }

  // Station list
  await page.route('**/api/stations?**', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: MOCK_STATIONS } })
  )
  await page.route('**/api/stations/[!\\?]*', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: null } })
  )
  // Device list
  await page.route('**/api/devices?**', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: MOCK_DEVICES } })
  )
  await page.route('**/api/devices/[!\\?]*', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: null } })
  )
  // Order list
  await page.route('**/api/orders?**', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: MOCK_ORDERS } })
  )
  // Dashboard APIs - single catch-all with URL-based dispatch
  await page.route('**/api/dashboard/**', (route: any) => {
    const url = route.request().url()
    if (url.includes('/overview')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: data.dashboardStats } })
    }
    if (url.includes('/recent-orders')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: apiData.recentOrders ?? MOCK_RECENT_ORDERS } })
    }
    if (url.includes('/station-rank')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: apiData.stationRank ?? [] } })
    }
    if (url.includes('/todo-counts')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: apiData.todoCounts ?? { pendingAlerts: 3, pendingWorkOrders: 2, settledOrders: 5, refundingOrders: 1 } } })
    }
    if (url.includes('/trend')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: apiData.chartData ?? { dates: [], orderCounts: [], revenues: [], energies: [] } } })
    }
    route.fulfill({ json: { code: 0, message: 'success', data: {} } })
  })
  // Block WebSocket to avoid connection errors
  await page.route('ws://**', (route: any) => route.abort('blockedbyclient'))
}

// ── Helper: set admin auth token before navigation ─────────────────────────────
async function setupAdminAuth(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'mock-token-for-test')
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
//  admin-web: Frontend-Backend Data Sync Tests
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('admin-web 数据完整性 - 前后端同步', () => {

  test('Dashboard 统计卡片与 /api/dashboard/stats 一致', async ({ page }) => {
    await setupAdminMockRoutes(page)
    await setupAdminAuth(page)

    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    const apiStats = MOCK_DASHBOARD_STATS

    const kpiCards = page.locator('.kpi-card')
    await expect(kpiCards).toHaveCount(6, { timeout: 15000 })

    // 运营指标卡片验证
    const operationTitles = ['今日充电量', '今日营收', '今日订单数']
    const todayEnergyKwh = Math.round(apiStats.todayEnergy / 1000)
    const todayRevenueYuan = Math.round(apiStats.todayRevenue / 100)
    const operationValues = [
      todayEnergyKwh.toLocaleString(),  // e.g. "8,923"
      todayRevenueYuan >= 10000
        ? '¥' + (todayRevenueYuan / 10000).toFixed(1) + '万'
        : '¥' + todayRevenueYuan.toLocaleString(),
      apiStats.todayOrderCount.toLocaleString(),  // e.g. "156"
    ]

    for (let i = 0; i < operationTitles.length; i++) {
      const card = kpiCards.nth(i)
      await expect(card.locator('.kpi-title')).toContainText(operationTitles[i])
      await expect(card.locator('.kpi-value')).toContainText(operationValues[i])
    }

    // 设备指标卡片验证
    const deviceTitles = ['站点总数', '设备在线率', '累计电量']
    const totalEnergyKwh = Math.round(apiStats.totalEnergy / 1000)
    const deviceValues = [
      apiStats.stationCount.toLocaleString(),
      apiStats.deviceCount > 0 ? ((apiStats.onlineDeviceCount / apiStats.deviceCount) * 100).toFixed(1) : '0',
      totalEnergyKwh.toLocaleString(),
    ]

    for (let i = 0; i < deviceTitles.length; i++) {
      const card = kpiCards.nth(3 + i)
      await expect(card.locator('.kpi-title')).toContainText(deviceTitles[i])
      await expect(card.locator('.kpi-value')).toContainText(deviceValues[i])
    }
  })

  test('Dashboard 最近订单与 /api/dashboard/recent-orders 一致', async ({ page }) => {
    await setupAdminMockRoutes(page)
    await setupAdminAuth(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    // 验证最近订单表格行数
    const tableRows = page.locator('.el-table .el-table__body-wrapper .el-table__row')
    await expect(tableRows).toHaveCount(MOCK_RECENT_ORDERS.length, { timeout: 15000 })

    // 逐行验证订单号和充电站名称
    for (let i = 0; i < MOCK_RECENT_ORDERS.length; i++) {
      const row = tableRows.nth(i)
      await expect(row.locator('.cell').first()).toContainText(MOCK_RECENT_ORDERS[i].orderNo)
      await expect(row.locator('.cell').nth(2)).toContainText(MOCK_RECENT_ORDERS[i].stationName)
    }
  })

  test('充电站列表与 /api/v1/stations 一致', async ({ page }) => {
    await setupAdminMockRoutes(page)
    await setupAdminAuth(page)
    await page.goto('/station')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const apiData = MOCK_STATIONS
    const tableRows = page.locator('.el-table .el-table__body-wrapper .el-table__row')
    await expect(tableRows).toHaveCount(apiData.list.length, { timeout: 15000 })

    // 验证首行数据与 API 一致
    const firstRow = tableRows.first()
    const rowText = await firstRow.innerText()
    expect(rowText).toContain(apiData.list[0].name)
  })

  test('设备列表与 /api/devices 一致', async ({ page }) => {
    await setupAdminMockRoutes(page)
    await setupAdminAuth(page)
    await page.goto('/device')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const apiData = MOCK_DEVICES
    const tableRows = page.locator('.el-table .el-table__body-wrapper .el-table__row')
    await expect(tableRows).toHaveCount(apiData.list.length, { timeout: 15000 })

    // 验证首行设备编号
    const firstRow = tableRows.first()
    await expect(firstRow.locator('.cell').first()).toContainText(apiData.list[0].code)
  })

  test('订单列表与 /api/v1/orders 一致', async ({ page }) => {
    await setupAdminMockRoutes(page)
    await setupAdminAuth(page)
    await page.goto('/order')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const apiData = MOCK_ORDERS
    const tableRows = page.locator('.el-table .el-table__body-wrapper .el-table__row')
    await expect(tableRows).toHaveCount(apiData.list.length, { timeout: 15000 })

    // 验证首行订单号
    const firstRow = tableRows.first()
    await expect(firstRow.locator('.cell').first()).toContainText(apiData.list[0].orderNo)
  })
})
