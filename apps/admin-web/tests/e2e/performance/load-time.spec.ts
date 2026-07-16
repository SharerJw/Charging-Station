import { test, expect } from '@playwright/test'
import { setupApiMocks } from '../fixtures/api-mocks'

test.describe('页面加载性能', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-token-for-test')
    })
  })

  test('Dashboard 首屏加载 < 3秒', async ({ page }) => {
    const start = Date.now()
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(3000)
  })

  test('无 JS 控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })

  test('无未处理的 Promise rejection', async ({ page }) => {
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    expect(rejections).toHaveLength(0)
  })
})
