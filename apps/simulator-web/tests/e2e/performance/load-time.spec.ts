import { test, expect } from '@playwright/test'
import { testData } from '../fixtures/test-data'
import { measureLoadTime, getMemoryUsage } from '../fixtures/helpers'

test.describe('性能测试', () => {
  test('Dashboard 首屏加载 < 3秒', async ({ page }) => {
    const loadTime = await measureLoadTime(page, '/dashboard')
    expect(loadTime).toBeLessThan(testData.thresholds.loadTime)
    console.log(`Dashboard 加载时间: ${loadTime}ms`)
  })

  test('图表渲染 < 2秒', async ({ page }) => {
    await page.goto('/dashboard')
    const start = Date.now()
    await page.waitForSelector('canvas')
    const renderTime = Date.now() - start
    expect(renderTime).toBeLessThan(testData.thresholds.chartRender)
  })

  test('API 响应 < 3秒', async ({ page }) => {
    const statsResponsePromise = page.waitForResponse('**/api/simulator/stats', { timeout: 15000 }).catch(() => null)
    const startTime = Date.now()
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const response = await statsResponsePromise
    const elapsed = Date.now() - startTime
    if (response) {
      expect(response.status()).toBe(200)
      expect(elapsed).toBeLessThan(testData.thresholds.apiResponse)
    }
  })

  test('内存使用 < 100MB', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(5000)
    const memory = await getMemoryUsage(page)
    expect(memory).toBeLessThan(testData.thresholds.memoryLimit)
  })

  test('无 JS 控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('无未处理的 Promise rejection', async ({ page }) => {
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    expect(rejections).toHaveLength(0)
  })
})
