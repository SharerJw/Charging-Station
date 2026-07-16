import { test, expect } from '@playwright/test'

// Mock API data
const MOCK_STATIONS = [
  { id: 'S001', name: '国贸中心充电站', address: '北京市朝阳区建国门外大街1号', availablePorts: 5, deviceCount: 12, electricityPrice: 1.2, servicePrice: 0.8, distance: 800, latitude: 39.91, longitude: 116.46 },
  { id: 'S002', name: '望京SOHO充电站', address: '北京市朝阳区望京街10号', availablePorts: 3, deviceCount: 8, electricityPrice: 1.15, servicePrice: 0.75, distance: 1500, latitude: 39.99, longitude: 116.48 },
]

const MOCK_USER_INFO = {
  id: 'U001', nickname: '测试用户', phone: '13800138000', avatar: '', balance: 12350, couponCount: 5,
}

// Setup auth and mock API routes before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-e2e-token')
  })

  await page.route('**/api/v1/stations**', (route) =>
    route.fulfill({ json: { code: 0, data: MOCK_STATIONS } })
  )
  await page.route('**/api/v1/user/profile', (route) =>
    route.fulfill({ json: { code: 0, data: MOCK_USER_INFO } })
  )
  await page.route('**/api/v1/charging/**', (route) =>
    route.fulfill({ json: { code: 0, data: null } })
  )
  await page.route('**/api/v1/orders**', (route) =>
    route.fulfill({ json: { code: 0, data: [] } })
  )
})

test.describe('底部导航', () => {
  test('底部导航栏各标签应可点击', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    const tabBar = page.locator('.uni-tabbar')
    await expect(tabBar).toBeVisible({ timeout: 10000 })

    // 确认所有 4 个 tab 存在
    const tabItems = tabBar.locator('.uni-tabbar__item')
    await expect(tabItems).toHaveCount(4)
  })

  test('点击不同 tab 应跳转到对应页面', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.index-page')).toBeVisible({ timeout: 10000 })

    // 点击"找桩" tab
    const tabBar = page.locator('.uni-tabbar')
    await tabBar.locator('.uni-tabbar__item').nth(1).click()
    await expect(page.locator('.map-page')).toBeVisible()

    // 点击"订单" tab
    await tabBar.locator('.uni-tabbar__item').nth(2).click()
    await expect(page.locator('.order-page')).toBeVisible()

    // 点击"我的" tab
    await tabBar.locator('.uni-tabbar__item').nth(3).click()
    await expect(page.locator('.profile-page')).toBeVisible()
  })
})
