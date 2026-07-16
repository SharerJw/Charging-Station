import { test, expect } from '@playwright/test'

test.describe('工单页面', () => {
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

  test('工单页面应正确加载', async ({ page }) => {
    await page.goto('/#/pages/workorder/index')
    await expect(page.locator('.workorder-page')).toBeVisible({ timeout: 10000 })
  })

  test('工单列表应渲染（含空状态）', async ({ page }) => {
    await page.goto('/#/pages/workorder/index')
    await expect(page.locator('.workorder-page')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.workorder-list').or(page.locator('.empty-state')).or(page.locator('.no-more'))).toBeVisible({ timeout: 10000 })
  })
})
