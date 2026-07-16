import { test, expect } from '@playwright/test'

test.describe('全量回归测试', () => {
  const pages = [
    { name: '工作台', path: '/#/pages/index/index', selector: '.workbench-page' },
    { name: '告警', path: '/#/pages/alert/index', selector: '.alert-page' },
    { name: '工单', path: '/#/pages/workorder/index', selector: '.workorder-page' },
    { name: '站点', path: '/#/pages/station/index', selector: '.station-page' },
    { name: '巡检', path: '/#/pages/inspection/index', selector: '.inspection-page' },
    { name: '个人', path: '/#/pages/profile/index', selector: '.profile-page' },
  ]

  for (const p of pages) {
    test(`${p.name}页面加载不报错 (${p.path})`, async ({ page }) => {
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
      await page.goto(p.path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1000)
      await expect(page.locator(p.selector)).toBeVisible({ timeout: 10000 })
    })
  }

  test('所有页面无JS控制台错误', async ({ page }) => {
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
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    for (const p of pages) {
      await page.goto(p.path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(500)
    }
    const criticalErrors = errors.filter(e => !e.includes('Failed to fetch') && !e.includes('net::'))
    expect(criticalErrors).toHaveLength(0)
  })

  test('所有页面无未处理Promise rejection', async ({ page }) => {
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
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    for (const p of pages) {
      await page.goto(p.path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(500)
    }
    const criticalRejections = rejections.filter(r => !r.includes('fetch') && !r.includes('Network'))
    expect(criticalRejections).toHaveLength(0)
  })
})
