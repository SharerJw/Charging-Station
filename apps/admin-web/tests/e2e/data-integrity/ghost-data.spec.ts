import { test, expect } from '@playwright/test'

// ── Stable mock data for ghost data detection ──────────────────────────────────
const STABLE_DASHBOARD_STATS = {
  stationCount: 12,
  deviceCount: 48,
  onlineDeviceCount: 45,
  todayOrderCount: 156,
  todayRevenue: 3286500,
  monthRevenue: 9876543,
  totalEnergy: 123456000,
  todayEnergy: 8923400,
}

const STABLE_STATIONS = {
  list: [
    { id: 'S001', name: '国贸中心充电站', code: 'GM-001', address: '北京市朝阳区建国门外大街1号', status: 'ACTIVE', deviceCount: 12, onlineCount: 11 },
    { id: 'S002', name: '望京SOHO充电站', code: 'WJ-001', address: '北京市朝阳区望京街10号', status: 'ACTIVE', deviceCount: 8, onlineCount: 8 },
    { id: 'S003', name: '中关村科技园充电站', code: 'ZGC-001', address: '北京市海淀区中关村大街1号', status: 'MAINTENANCE', deviceCount: 15, onlineCount: 10 },
  ],
  total: 3, page: 1, size: 20,
}

const STABLE_ORDERS = {
  list: [
    { id: 'O001', orderNo: 'ORD20240701001', userName: '张三', stationName: '国贸中心充电站', status: 'PAID', consumedEnergy: 45.6, totalAmount: 82.08, startTime: '2024-07-01T10:00:00' },
    { id: 'O002', orderNo: 'ORD20240701002', userName: '李四', stationName: '望京SOHO充电站', status: 'CHARGING', consumedEnergy: 12.3, totalAmount: 22.14, startTime: '2024-07-01T11:30:00' },
    { id: 'O003', orderNo: 'ORD20240701003', userName: '王五', stationName: '国贸中心充电站', status: 'PAID', consumedEnergy: 30.0, totalAmount: 54.00, startTime: '2024-07-01T14:00:00' },
  ],
  total: 3, page: 1, size: 20,
}

const STABLE_RECENT_ORDERS = [
  { id: 'O001', orderNo: 'ORD20240701001', userName: '张三', stationName: '国贸中心充电站', status: 'PAID', consumedEnergy: 45.6, totalAmount: 82.08, startTime: '2024-07-01T10:00:00' },
  { id: 'O002', orderNo: 'ORD20240701002', userName: '李四', stationName: '望京SOHO充电站', status: 'CHARGING', consumedEnergy: 12.3, totalAmount: 22.14, startTime: '2024-07-01T11:30:00' },
  { id: 'O003', orderNo: 'ORD20240701003', userName: '王五', stationName: '国贸中心充电站', status: 'PAID', consumedEnergy: 30.0, totalAmount: 54.00, startTime: '2024-07-01T14:00:00' },
]

// ── Setup mock routes returning stable data ────────────────────────────────────
async function setupStableMockRoutes(page: any) {
  // Station list
  await page.route('**/api/stations?**', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: STABLE_STATIONS } })
  )
  await page.route('**/api/stations/[!\\?]*', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: null } })
  )
  // Device list
  await page.route('**/api/devices?**', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: { list: [], total: 0, page: 1, size: 20 } } })
  )
  await page.route('**/api/devices/[!\\?]*', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: null } })
  )
  // Order list
  await page.route('**/api/orders?**', (route: any) =>
    route.fulfill({ json: { code: 0, message: 'success', data: STABLE_ORDERS } })
  )
  // Dashboard APIs - single catch-all with URL-based dispatch
  await page.route('**/api/dashboard/**', (route: any) => {
    const url = route.request().url()
    if (url.includes('/overview')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: STABLE_DASHBOARD_STATS } })
    }
    if (url.includes('/recent-orders')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: STABLE_RECENT_ORDERS } })
    }
    if (url.includes('/station-rank')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: [] } })
    }
    if (url.includes('/todo-counts')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: { pendingAlerts: 0, pendingWorkOrders: 0, settledOrders: 0, refundingOrders: 0 } } })
    }
    if (url.includes('/trend')) {
      return route.fulfill({ json: { code: 0, message: 'success', data: { dates: [], orderCounts: [], revenues: [], energies: [] } } })
    }
    route.fulfill({ json: { code: 0, message: 'success', data: {} } })
  })
  // Block WebSocket to avoid connection errors
  await page.route('ws://**', (route: any) => route.abort('blockedbyclient'))
}

async function setupAdminAuth(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'mock-token-for-test')
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
//  admin-web: Ghost Data Detection Tests
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('admin-web 数据完整性 - 幽灵数据检测', () => {

  test('Dashboard 刷新3次 KPI卡片数据不变', async ({ page }) => {
    await setupStableMockRoutes(page)
    await setupAdminAuth(page)

    // 第一次加载
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    const kpiCards = page.locator('.kpi-card')
    await expect(kpiCards).toHaveCount(6, { timeout: 15000 })

    // 采集第一轮数据
    const round1Values: string[] = []
    for (let i = 0; i < 6; i++) {
      const value = await kpiCards.nth(i).locator('.kpi-value').innerText()
      round1Values.push(value)
    }

    // 刷新3次，每次都对比第一轮
    for (let refresh = 1; refresh <= 3; refresh++) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)
      await expect(kpiCards).toHaveCount(6, { timeout: 15000 })

      for (let i = 0; i < 6; i++) {
        const currentValue = await kpiCards.nth(i).locator('.kpi-value').innerText()
        expect(currentValue).toBe(round1Values[i])
      }
    }
  })

  test('充电站页面刷新3次列表不变', async ({ page }) => {
    await setupStableMockRoutes(page)
    await setupAdminAuth(page)

    // 第一次加载
    await page.goto('/station')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const rows = page.locator('.el-table .el-table__body-wrapper .el-table__row')
    await expect(rows).toHaveCount(STABLE_STATIONS.list.length, { timeout: 15000 })

    // 采集第一行数据
    const firstRowText1 = await rows.first().innerText()

    // 刷新3次，验证列表一致
    for (let refresh = 1; refresh <= 3; refresh++) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      await expect(rows).toHaveCount(STABLE_STATIONS.list.length, { timeout: 15000 })

      const currentFirstRowText = await rows.first().innerText()
      expect(currentFirstRowText).toBe(firstRowText1)
    }
  })

  test('订单页面刷新3次列表不变', async ({ page }) => {
    await setupStableMockRoutes(page)
    await setupAdminAuth(page)

    // 第一次加载
    await page.goto('/order')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const rows = page.locator('.el-table .el-table__body-wrapper .el-table__row')
    await expect(rows).toHaveCount(STABLE_ORDERS.list.length, { timeout: 15000 })

    // 采集第一行数据
    const firstRowText1 = await rows.first().innerText()

    // 刷新3次，验证列表一致
    for (let refresh = 1; refresh <= 3; refresh++) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      await expect(rows).toHaveCount(STABLE_ORDERS.list.length, { timeout: 15000 })

      const currentFirstRowText = await rows.first().innerText()
      expect(currentFirstRowText).toBe(firstRowText1)
    }
  })
})
