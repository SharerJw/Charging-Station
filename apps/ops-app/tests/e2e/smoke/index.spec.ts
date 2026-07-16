import { test, expect } from '@playwright/test'

test.describe('工作台', () => {
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

  test('工作台应正确加载', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await expect(page.locator('.workbench-page')).toBeVisible({ timeout: 10000 })
  })

  test('待办和告警区域应可见', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await expect(page.locator('.workbench-page')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.stats-row')).toBeVisible({ timeout: 10000 })
  })

  test('底部导航栏应可见', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await expect(page.locator('.uni-tabbar')).toBeVisible({ timeout: 10000 })
  })
})
