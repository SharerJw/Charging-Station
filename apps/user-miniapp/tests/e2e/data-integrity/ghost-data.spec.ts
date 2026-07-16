import { test, expect } from '@playwright/test'

// ── Stable mock data for ghost data detection ──────────────────────────────────
const STABLE_USER_INFO = {
  id: 'U001',
  nickname: '测试用户',
  phone: '13800138000',
  avatar: '',
  balance: 12350,
  couponCount: 5,
}

const STABLE_STATIONS = [
  { id: 'S001', name: '国贸中心充电站', address: '北京市朝阳区建国门外大街1号', availablePorts: 5, deviceCount: 12, electricityPrice: 1.2, servicePrice: 0.8, distance: 800 },
  { id: 'S002', name: '望京SOHO充电站', address: '北京市朝阳区望京街10号', availablePorts: 3, deviceCount: 8, electricityPrice: 1.15, servicePrice: 0.75, distance: 1500 },
  { id: 'S003', name: '中关村科技园充电站', address: '北京市海淀区中关村大街1号', availablePorts: 8, deviceCount: 15, electricityPrice: 1.1, servicePrice: 0.7, distance: 3200 },
]

const STABLE_ORDERS = [
  { id: 'O001', orderNo: 'UO20240701001', stationName: '国贸中心充电站', status: 'completed', startTime: '2024-07-01 10:00', consumedEnergy: 45.6, totalAmount: 82.08 },
  { id: 'O002', orderNo: 'UO20240701002', stationName: '望京SOHO充电站', status: 'charging', startTime: '2024-07-01 11:30', consumedEnergy: 12.3, totalAmount: 22.14 },
  { id: 'O003', orderNo: 'UO20240701003', stationName: '国贸中心充电站', status: 'completed', startTime: '2024-07-01 14:00', consumedEnergy: 30.0, totalAmount: 54.00 },
]

// ── Setup mock routes returning stable data ────────────────────────────────────
async function setupStableMockRoutes(page: any) {
  await page.route('**/api/v1/user/profile', (route: any) =>
    route.fulfill({ json: { code: 0, data: STABLE_USER_INFO } })
  )
  await page.route('**/api/v1/stations**', (route: any) =>
    route.fulfill({ json: { code: 0, data: STABLE_STATIONS } })
  )
  await page.route('**/api/v1/orders**', (route: any) =>
    route.fulfill({ json: { code: 0, data: STABLE_ORDERS } })
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
//  user-miniapp: Ghost Data Detection Tests
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('user-miniapp 数据完整性 - 幽灵数据检测', () => {

  test('首页刷新3次余额和充电站不变', async ({ page }) => {
    await setupStableMockRoutes(page)
    await setupUserAuth(page)

    // 第一次加载
    await page.goto('/#/pages/index/index')
    await page.waitForTimeout(2000)

    // 采集余额
    const balanceEl = page.locator('.balance-value')
    await expect(balanceEl).toContainText('¥123.50', { timeout: 10000 })
    const balanceText1 = await balanceEl.innerText()

    // 采集充电站数量和第一个站点名称
    const stationCards = page.locator('.station-card')
    const stationCount1 = await stationCards.count()
    await expect(stationCards).toHaveCount(3, { timeout: 10000 })
    const firstStationName1 = await stationCards.first().locator('.station-name').innerText()

    // 刷新3次，验证数据一致
    for (let refresh = 1; refresh <= 3; refresh++) {
      await page.goto('/#/pages/index/index')
      await page.waitForTimeout(2000)

      // 验证余额
      const currentBalance = await balanceEl.innerText()
      expect(currentBalance).toBe(balanceText1)

      // 验证充电站
      const currentCount = await stationCards.count()
      expect(currentCount).toBe(stationCount1)
      const currentFirstStation = await stationCards.first().locator('.station-name').innerText()
      expect(currentFirstStation).toBe(firstStationName1)
    }
  })

  test('订单页刷新3次列表不变', async ({ page }) => {
    await setupStableMockRoutes(page)
    await setupUserAuth(page)

    // 第一次加载
    await page.goto('/#/pages/order/index')
    await page.waitForTimeout(2000)

    const orderCards = page.locator('.order-card')
    await expect(orderCards).toHaveCount(STABLE_ORDERS.length, { timeout: 10000 })

    // 采集第一轮数据
    const firstOrderNo1 = await orderCards.first().locator('.order-no').innerText()
    const firstStationName1 = await orderCards.first().locator('.station-name').innerText()
    const orderCount1 = await orderCards.count()

    // 刷新3次，验证列表一致
    for (let refresh = 1; refresh <= 3; refresh++) {
      await page.goto('/#/pages/order/index')
      await page.waitForTimeout(2000)

      const currentCount = await orderCards.count()
      expect(currentCount).toBe(orderCount1)

      const currentOrderNo = await orderCards.first().locator('.order-no').innerText()
      expect(currentOrderNo).toBe(firstOrderNo1)

      const currentStationName = await orderCards.first().locator('.station-name').innerText()
      expect(currentStationName).toBe(firstStationName1)
    }
  })
})
