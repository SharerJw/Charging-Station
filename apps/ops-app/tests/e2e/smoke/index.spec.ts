import { test, expect } from '@playwright/test'

test.describe('工作台', () => {
  test('工作台应正确加载', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await expect(page.locator('.workbench-page')).toBeVisible({ timeout: 10000 })
  })

  test('待办和告警区域应可见', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    // 统计卡片
    await expect(page.locator('.stats-row')).toBeVisible({ timeout: 10000 })
    // 告警筛选区
    await expect(page.locator('.alert-filter')).toBeVisible({ timeout: 10000 })
    // 告警列表（含空状态也算通过）
    await expect(
      page.locator('.alert-list').or(page.locator('.no-more')),
    ).toBeVisible({ timeout: 10000 })
  })

  test('底部导航栏应可见', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    // UniApp H5 tabBar 渲染在页面底部
    const tabBar = page.locator('.uni-tabbar').or(page.locator('[class*="tabbar"]'))
    await expect(tabBar).toBeVisible({ timeout: 10000 })
  })
})
