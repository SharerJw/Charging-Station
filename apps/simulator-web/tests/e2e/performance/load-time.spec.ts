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

  test('API 响应 < 1秒', async ({ page }) => {
    const responsePromise = page.waitForResponse('**/api/simulator/stats')
    await page.goto('/dashboard')
    const response = await responsePromise
    expect(response.status()).toBe(200)
    const timing = response.timing()
    expect(timing.responseEnd - timing.requestStart).toBeLessThan(testData.thresholds.apiResponse)
  })

  test('内存使用 < 100MB', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(5000)
    const memory = await getMemoryUsage(page)
    expect(memory).toBeLessThan(testData.thresholds.memoryLimit)
  })
})
