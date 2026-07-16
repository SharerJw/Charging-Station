import { test, expect } from '@playwright/test'

test.describe('首页', () => {
  test('首页应成功加载', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await expect(page.locator('.index-page')).toBeVisible()
    await expect(page.locator('.title')).toContainText('EV充电平台')
  })

  test('附近充电站列表区域应可见', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    const stationList = page.locator('.station-list')
    await expect(stationList).toBeVisible()
  })

  test('底部导航栏应可见', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    const tabBar = page.locator('.uni-tabbar')
    await expect(tabBar).toBeVisible()
  })
})
