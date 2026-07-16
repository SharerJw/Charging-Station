import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: 'Desktop 1920', width: 1920, height: 1080 },
  { name: 'Laptop 1366', width: 1366, height: 768 },
  { name: 'Tablet 768', width: 768, height: 1024 },
]

test.describe('视口兼容性', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} 页面正常渲染`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
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
      await page.goto('/#/pages/index/index')
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(1000)
      await expect(page.locator('.workbench-page')).toBeVisible({ timeout: 15000 })
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const clientWidth = await page.evaluate(() => document.body.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
    })
  }
})
