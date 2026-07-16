import { test, expect } from '@playwright/test'

test.describe('工单页面', () => {
  test('工单页面应正确加载', async ({ page }) => {
    await page.goto('/#/pages/workorder/index')
    await expect(page.locator('.workorder-page')).toBeVisible({ timeout: 10000 })
  })

  test('工单列表应渲染（含空状态）', async ({ page }) => {
    await page.goto('/#/pages/workorder/index')
    // 工单列表或空状态至少一个可见
    const workorderList = page.locator('.workorder-list')
    const emptyState = page.locator('.empty-state')
    await expect(workorderList.or(emptyState)).toBeVisible({ timeout: 10000 })
    // 搜索栏应可见
    await expect(page.locator('.search-bar')).toBeVisible({ timeout: 10000 })
    // 筛选标签应可见
    await expect(page.locator('.tabs')).toBeVisible({ timeout: 10000 })
  })
})
