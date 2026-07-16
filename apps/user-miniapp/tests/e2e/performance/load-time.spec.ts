import { test, expect } from '@playwright/test'

test.describe('页面加载性能', () => {
  test('首页加载 < 3秒', async ({ page }) => {
    const start = Date.now()
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('networkidle')
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
    await page.waitForLoadState('networkidle')
    expect(errors).toHaveLength(0)
  })

  test('无未处理Promise rejection', async ({ page }) => {
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('networkidle')
    expect(rejections).toHaveLength(0)
  })
})
