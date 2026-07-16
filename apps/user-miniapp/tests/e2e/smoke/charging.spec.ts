import { test, expect } from '@playwright/test'

// Setup auth and mock API routes before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-e2e-token')
  })

  // Mock all API responses to prevent 401 redirects
  await page.route('**/api/v1/charging/**', (route) =>
    route.fulfill({ json: { code: 0, data: null } })
  )
  await page.route('**/api/v1/stations**', (route) =>
    route.fulfill({ json: { code: 0, data: [] } })
  )
  await page.route('**/api/v1/user/profile', (route) =>
    route.fulfill({ json: { code: 0, data: { id: 'U001', nickname: '测试用户', phone: '13800138000', avatar: '', balance: 12350, couponCount: 5 } } })
  )
  await page.route('**/api/v1/orders**', (route) =>
    route.fulfill({ json: { code: 0, data: [] } })
  )
})

test.describe('充电监控页', () => {
  test('充电页面应成功加载', async ({ page }) => {
    await page.goto('/#/pages/charging/index')
    await expect(page.locator('.charging-page')).toBeVisible({ timeout: 10000 })
  })

  test('无会话时应显示空状态或充电状态区域', async ({ page }) => {
    await page.goto('/#/pages/charging/index')
    // 页面加载后，要么显示空状态，要么显示充电状态卡片
    const emptyState = page.locator('.empty-state')
    const statusCard = page.locator('.status-card')
    await expect(emptyState.or(statusCard)).toBeVisible({ timeout: 10000 })
  })
})
