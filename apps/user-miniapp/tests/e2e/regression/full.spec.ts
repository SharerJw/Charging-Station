import { test, expect } from '@playwright/test'

// Mock API data
const MOCK_STATIONS = [
  { id: 'S001', name: '国贸中心充电站', address: '北京市朝阳区建国门外大街1号', availablePorts: 5, deviceCount: 12, electricityPrice: 1.2, servicePrice: 0.8, distance: 800, latitude: 39.91, longitude: 116.46 },
  { id: 'S002', name: '望京SOHO充电站', address: '北京市朝阳区望京街10号', availablePorts: 3, deviceCount: 8, electricityPrice: 1.15, servicePrice: 0.75, distance: 1500, latitude: 39.99, longitude: 116.48 },
]

const MOCK_USER_INFO = {
  id: 'U001', nickname: '测试用户', phone: '13800138000', avatar: '', balance: 12350, couponCount: 5,
}

// Set auth token and mock API routes before each test
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

test.describe('全量回归测试', () => {
  const pages = [
    { name: '首页', path: '/#/pages/index/index', selector: '.index-page' },
    { name: '找桩', path: '/#/pages/map/index', selector: '.map-page' },
    { name: '充电', path: '/#/pages/charging/index', selector: '.charging-page' },
    { name: '订单', path: '/#/pages/order/index', selector: '.order-page' },
    { name: '我的', path: '/#/pages/profile/index', selector: '.profile-page' },
  ]

  for (const p of pages) {
    test(`${p.name}页面加载不报错 (${p.path})`, async ({ page }) => {
      await page.goto(p.path)
      await page.waitForLoadState('domcontentloaded')
      // 页面容器应存在（允许有空状态）
      const container = page.locator(p.selector).first()
      await expect(container).toBeVisible({ timeout: 10000 })
    })
  }

  test('所有页面无JS控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    for (const p of pages) {
      await page.goto(p.path)
      await page.waitForLoadState('domcontentloaded')
    }
    expect(errors).toHaveLength(0)
  })

  test('所有页面无未处理Promise rejection', async ({ page }) => {
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    for (const p of pages) {
      await page.goto(p.path)
      await page.waitForLoadState('domcontentloaded')
    }
    expect(rejections).toHaveLength(0)
  })
})
