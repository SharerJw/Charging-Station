import { test, expect } from '@playwright/test'

test.describe('页面加载性能', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/ops/**', (route: any) =>
      route.fulfill({ json: { code: 0, data: { list: [], total: 0 } } })
    )
    await page.route('**/internal/**', (route: any) =>
      route.fulfill({ json: { code: 0, data: { onlineDeviceCount: 0 } } })
    )
    await page.route('ws://**', (route: any) => route.abort('blockedbyclient'))
    await page.addInitScript(() => {
      localStorage.setItem('ops_token', 'mock-ops-token')
    })
  })

  test('首页加载 < 3秒', async ({ page }) => {
    const start = Date.now()
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - start
    expect(loadTime).toBeLessThan(3000)
  })

  test('无JS控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })

  test('无未处理Promise rejection', async ({ page }) => {
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)
    expect(rejections).toHaveLength(0)
  })
})
