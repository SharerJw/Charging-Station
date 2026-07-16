import { test, expect } from '@playwright/test'

test.describe('底部导航栏', () => {
  test('底部导航栏应可点击', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    const tabBar = page.locator('.uni-tabbar').or(page.locator('[class*="tabbar"]'))
    await expect(tabBar).toBeVisible({ timeout: 10000 })
    // tabBar 内应有至少4个tab项
    const tabItems = tabBar.locator('.uni-tabbar__item, [class*="tab-item"]')
    const count = await tabItems.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('点击告警tab应跳转到告警页面', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    const tabBar = page.locator('.uni-tabbar').or(page.locator('[class*="tabbar"]'))
    await expect(tabBar).toBeVisible({ timeout: 10000 })

    // 点击告警tab（第二个tab）
    const alertTab = tabBar.locator('.uni-tabbar__item, [class*="tab-item"]').nth(1)
    await alertTab.click()

    // 等待页面跳转
    await page.waitForURL('**/pages/alert/index**', { timeout: 10000 })
    await expect(page.locator('.alert-page')).toBeVisible({ timeout: 10000 })
  })
})
