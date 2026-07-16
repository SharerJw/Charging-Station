import { test, expect } from '@playwright/test'

// ── Mock data for user-miniapp API endpoints ───────────────────────────────────
const MOCK_USER_INFO = {
  id: 'U001',
  nickname: '测试用户',
  phone: '13800138000',
  avatar: '',
  balance: 12350,
  couponCount: 5,
}

const MOCK_STATIONS = [
  { id: 'S001', name: '国贸中心充电站', address: '北京市朝阳区建国门外大街1号', availablePorts: 5, deviceCount: 12, electricityPrice: 1.2, servicePrice: 0.8, distance: 800 },
  { id: 'S002', name: '望京SOHO充电站', address: '北京市朝阳区望京街10号', availablePorts: 3, deviceCount: 8, electricityPrice: 1.15, servicePrice: 0.75, distance: 1500 },
  { id: 'S003', name: '中关村科技园充电站', address: '北京市海淀区中关村大街1号', availablePorts: 8, deviceCount: 15, electricityPrice: 1.1, servicePrice: 0.7, distance: 3200 },
]

const MOCK_ORDERS = [
  { id: 'O001', orderNo: 'UO20240701001', stationName: '国贸中心充电站', status: 'completed', startTime: '2024-07-01 10:00', consumedEnergy: 45.6, totalAmount: 82.08 },
  { id: 'O002', orderNo: 'UO20240701002', stationName: '望京SOHO充电站', status: 'charging', startTime: '2024-07-01 11:30', consumedEnergy: 12.3, totalAmount: 22.14 },
  { id: 'O003', orderNo: 'UO20240701003', stationName: '国贸中心充电站', status: 'completed', startTime: '2024-07-01 14:00', consumedEnergy: 30.0, totalAmount: 54.00 },
]

// ── Setup mock routes for user-miniapp ─────────────────────────────────────────
async function setupUserMockRoutes(page: any, apiData: Record<string, any> = {}) {
  const data = { userInfo: MOCK_USER_INFO, stations: MOCK_STATIONS, orders: MOCK_ORDERS, ...apiData }

  await page.route('**/api/v1/user/profile', (route: any) =>
    route.fulfill({ json: { code: 0, data: data.userInfo } })
  )
  await page.route('**/api/v1/stations**', (route: any) =>
    route.fulfill({ json: { code: 0, data: data.stations } })
  )
  await page.route('**/api/v1/orders**', (route: any) =>
    route.fulfill({ json: { code: 0, data: data.orders } })
  )
  await page.route('**/api/v1/charging/**', (route: any) =>
    route.fulfill({ json: { code: 0, data: null } })
  )
  await page.route('**/api/v1/auth/**', (route: any) =>
    route.fulfill({ json: { code: 0, data: { token: 'mock-user-token', user: { id: 'U001' } } } })
  )
}

async function setupUserAuth(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-user-token')
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
//  user-miniapp: Frontend-Backend Data Sync Tests
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('user-miniapp 数据完整性 - 前后端同步', () => {

  test('首页余额与 API 一致', async ({ page }) => {
    await setupUserMockRoutes(page)
    await setupUserAuth(page)

    await page.goto('/#/pages/index/index')
    await page.waitForTimeout(2000)

    // API 返回 balance=12350 (分), 页面显示 balance/100 = 123.50
    const expectedBalance = (MOCK_USER_INFO.balance / 100).toFixed(2)
    const balanceEl = page.locator('.balance-value')
    await expect(balanceEl).toContainText(`¥${expectedBalance}`, { timeout: 10000 })
  })

  test('充电站列表与 /api/v1/stations 一致', async ({ page }) => {
    await setupUserMockRoutes(page)
    await setupUserAuth(page)

    await page.goto('/#/pages/index/index')
    await page.waitForTimeout(2000)

    // 首页最多展示3个最近充电站
    const stationCards = page.locator('.station-card')
    const displayCount = Math.min(MOCK_STATIONS.length, 3)
    await expect(stationCards).toHaveCount(displayCount, { timeout: 10000 })

    // 验证第一个充电站名称（按距离排序后最近的那个）
    const sortedStations = [...MOCK_STATIONS].sort((a, b) => a.distance - b.distance)
    await expect(stationCards.first().locator('.station-name')).toContainText(
      sortedStations[0].name
    )
  })

  test('订单列表与 API 一致', async ({ page }) => {
    await setupUserMockRoutes(page)
    await setupUserAuth(page)

    await page.goto('/#/pages/order/index')
    await page.waitForTimeout(2000)

    const orderCards = page.locator('.order-card')
    await expect(orderCards).toHaveCount(MOCK_ORDERS.length, { timeout: 10000 })

    // 验证第一条订单
    const firstOrder = orderCards.first()
    await expect(firstOrder.locator('.station-name')).toContainText(MOCK_ORDERS[0].stationName)
    await expect(firstOrder.locator('.order-no')).toContainText(MOCK_ORDERS[0].orderNo)
  })
})
