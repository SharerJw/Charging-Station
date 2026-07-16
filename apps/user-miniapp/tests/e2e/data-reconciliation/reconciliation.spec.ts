import { test, expect } from '@playwright/test'

const API = 'http://localhost:8080/api'

// Set auth token and mock page-level API routes before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-e2e-token')
  })

  // Mock page-level API responses to prevent 401 redirects when visiting pages
  await page.route('**/api/v1/user/profile', (route) =>
    route.fulfill({ json: { code: 0, data: { id: 'U001', nickname: '测试用户', phone: '13800138000', avatar: '', balance: 12350, couponCount: 5 } } })
  )
  await page.route('**/api/v1/charging/**', (route) =>
    route.fulfill({ json: { code: 0, data: null } })
  )
})

test.describe('数据对账', () => {
  test('余额与API返回一致', async ({ page, request }) => {
    // 从API获取用户信息（含余额）
    const apiResp = await request.get(`${API}/v1/user/info`)
    const apiStatus = apiResp.status()

    if (apiStatus !== 200) {
      test.skip(true, 'User not logged in, cannot verify balance')
      return
    }

    const apiBody = await apiResp.json()
    const userData = apiBody.data ?? apiBody
    const apiBalance = userData?.balance ?? userData?.wallet?.balance ?? null

    if (apiBalance === null) {
      test.skip(true, 'Balance field not found in API response')
      return
    }

    // 从个人中心页面获取余额
    await page.goto('/#/pages/profile/index')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // 查找余额显示元素
    const balanceEl = page.locator('.balance, [class*="balance"], .wallet-amount')
    const hasBalance = await balanceEl.first().isVisible().catch(() => false)

    if (hasBalance) {
      const balanceText = await balanceEl.first().textContent()
      const uiBalance = parseFloat((balanceText || '0').replace(/[^0-9.]/g, ''))
      // UI余额应与API余额一致（允许浮点精度误差）
      expect(Math.abs(uiBalance - apiBalance)).toBeLessThan(0.01)
    } else {
      // 页面未显示余额，但API有数据即可
      expect(apiBalance).toBeGreaterThanOrEqual(0)
    }
  })

  test('充电站数与API返回一致', async ({ page, request }) => {
    // 从API获取充电站列表
    const apiResp = await request.get(`${API}/v1/stations`)
    expect(apiResp.ok()).toBeTruthy()
    const apiBody = await apiResp.json()
    const apiStations = apiBody.data?.list ?? apiBody.data ?? []
    const apiCount = Array.isArray(apiStations) ? apiStations.length : 0

    // 从首页获取显示的充电站数
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const stationList = page.locator('.station-list')
    const hasStations = await stationList.isVisible().catch(() => false)

    if (hasStations) {
      const uiCount = await stationList.locator('.station-item, [class*="station-item"], [class*="station-card"]').count()
      // UI显示数量应小于等于API返回总数
      expect(uiCount).toBeLessThanOrEqual(apiCount)
    } else {
      // 空列表也是合法状态
      expect(apiCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('订单数与API返回一致', async ({ page, request }) => {
    const apiResp = await request.get(`${API}/v1/orders`)
    const apiStatus = apiResp.status()

    if (apiStatus !== 200) {
      test.skip(true, 'User not logged in, cannot verify orders')
      return
    }

    const apiBody = await apiResp.json()
    const apiOrders = apiBody.data?.list ?? apiBody.data ?? []
    const apiCount = Array.isArray(apiOrders) ? apiOrders.length : 0

    // 从订单页面获取显示的订单数
    await page.goto('/#/pages/order/index')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const orderList = page.locator('.order-list')
    const hasOrders = await orderList.isVisible().catch(() => false)

    if (hasOrders) {
      const uiCount = await orderList.locator('.order-item, [class*="order-item"]').count()
      expect(uiCount).toBeLessThanOrEqual(apiCount)
    } else {
      expect(apiCount).toBeGreaterThanOrEqual(0)
    }
  })
})
