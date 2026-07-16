import { test, expect } from '@playwright/test'

test.describe('底部导航栏', () => {
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

  test('底部导航栏应可点击', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await expect(page.locator('.uni-tabbar')).toBeVisible({ timeout: 10000 })
    const tabItems = page.locator('.uni-tabbar__item')
    const count = await tabItems.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('点击告警tab应跳转到告警页面', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await expect(page.locator('.uni-tabbar')).toBeVisible({ timeout: 10000 })
    const alertTab = page.locator('.uni-tabbar__item').nth(1)
    await alertTab.click()
    await page.waitForURL('**/pages/alert/index**', { timeout: 10000 })
    await expect(page.locator('.alert-page')).toBeVisible({ timeout: 10000 })
  })
})
