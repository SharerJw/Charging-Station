import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: 'Desktop 1920', width: 1920, height: 1080 },
  { name: 'Laptop 1366', width: 1366, height: 768 },
  { name: 'Tablet 768', width: 768, height: 1024 },
]

// Mock API data
const MOCK_STATIONS = [
  { id: 'S001', name: '国贸中心充电站', address: '北京市朝阳区建国门外大街1号', availablePorts: 5, deviceCount: 12, electricityPrice: 1.2, servicePrice: 0.8, distance: 800, latitude: 39.91, longitude: 116.46 },
  { id: 'S002', name: '望京SOHO充电站', address: '北京市朝阳区望京街10号', availablePorts: 3, deviceCount: 8, electricityPrice: 1.15, servicePrice: 0.75, distance: 1500, latitude: 39.99, longitude: 116.48 },
]

// Set auth token and mock API routes before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-e2e-token')
  })

  await page.route('**/api/v1/stations**', (route) =>
    route.fulfill({ json: { code: 0, data: MOCK_STATIONS } })
  )
  await page.route('**/api/v1/user/profile', (route) =>
    route.fulfill({ json: { code: 0, data: { id: 'U001', nickname: '测试用户', phone: '13800138000', avatar: '', balance: 12350, couponCount: 5 } } })
  )
  await page.route('**/api/v1/charging/**', (route) =>
    route.fulfill({ json: { code: 0, data: null } })
  )
  await page.route('**/api/v1/orders**', (route) =>
    route.fulfill({ json: { code: 0, data: [] } })
  )
})

test.describe('视口兼容性', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} 页面正常渲染`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/#/pages/index/index')
      await page.waitForLoadState('domcontentloaded')
      // 验证关键元素可见（UniApp H5 首页）
      await expect(
        page.locator('.index-page'),
      ).toBeVisible({ timeout: 15000 })
      // 验证无水平滚动
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const clientWidth = await page.evaluate(() => document.body.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // 5px tolerance
    })
  }
})
