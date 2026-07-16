import { test, expect } from '@playwright/test'

// Set auth token and mock API routes before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-e2e-token')
  })

  // Mock API responses to prevent 401 redirects and enable fast loading
  await page.route('**/api/v1/stations**', (route) =>
    route.fulfill({ json: { code: 0, data: [] } })
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

test.describe('页面加载性能', () => {
  test('首页加载 < 3秒', async ({ page }) => {
    const start = Date.now()
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - start
    console.log(`user-miniapp 首页加载时间: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000)
  })

  test('无JS控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('无未处理Promise rejection', async ({ page }) => {
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    expect(rejections).toHaveLength(0)
  })
})
