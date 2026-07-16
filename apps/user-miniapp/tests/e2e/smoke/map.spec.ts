import { test, expect } from '@playwright/test'

test.describe('找桩页', () => {
  test('找桩页面应成功加载', async ({ page }) => {
    await page.goto('/#/pages/map/index')
    await expect(page.locator('.map-page')).toBeVisible()
  })

  test('充电站列表区域应可见', async ({ page }) => {
    await page.goto('/#/pages/map/index')
    const listSection = page.locator('.list-section')
    await expect(listSection).toBeVisible()
    await expect(page.locator('.list-title')).toContainText('附近充电站')
  })
})
