import { test, expect } from '@playwright/test'

// Mock API data
const MOCK_STATIONS = [
  { id: 'S001', name: '国贸中心充电站', address: '北京市朝阳区建国门外大街1号', availablePorts: 5, deviceCount: 12, electricityPrice: 1.2, servicePrice: 0.8, distance: 800, latitude: 39.91, longitude: 116.46 },
  { id: 'S002', name: '望京SOHO充电站', address: '北京市朝阳区望京街10号', availablePorts: 3, deviceCount: 8, electricityPrice: 1.15, servicePrice: 0.75, distance: 1500, latitude: 39.99, longitude: 116.48 },
  { id: 'S003', name: '中关村科技园充电站', address: '北京市海淀区中关村大街1号', availablePorts: 8, deviceCount: 15, electricityPrice: 1.1, servicePrice: 0.7, distance: 3200, latitude: 39.98, longitude: 116.31 },
]

// Setup auth and mock API routes before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-e2e-token')
  })

  await page.route('**/api/v1/stations**', (route) =>
    route.fulfill({ json: { code: 0, data: MOCK_STATIONS } })
  )
  await page.route('**/api/v1/charging/**', (route) =>
    route.fulfill({ json: { code: 0, data: null } })
  )
  await page.route('**/api/v1/user/profile', (route) =>
    route.fulfill({ json: { code: 0, data: { id: 'U001', nickname: '测试用户', phone: '13800138000', avatar: '', balance: 12350, couponCount: 5 } } })
  )
})

test.describe('找桩页', () => {
  test('找桩页面应成功加载', async ({ page }) => {
    await page.goto('/#/pages/map/index')
    await expect(page.locator('.map-page')).toBeVisible({ timeout: 10000 })
  })

  test('充电站列表区域应可见', async ({ page }) => {
    await page.goto('/#/pages/map/index')
    await page.waitForLoadState('domcontentloaded')
    const listSection = page.locator('.list-section')
    await expect(listSection).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.list-title')).toContainText('附近充电站')
  })
})
