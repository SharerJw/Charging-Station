import { test, expect } from '@playwright/test'

test.describe('告警页面', () => {
  test('告警页面应正确加载', async ({ page }) => {
    await page.goto('/#/pages/alert/index')
    await expect(page.locator('.alert-page')).toBeVisible({ timeout: 10000 })
  })

  test('告警列表应渲染（含空状态）', async ({ page }) => {
    await page.goto('/#/pages/alert/index')
    // 告警列表或空状态至少一个可见
    const alertList = page.locator('.alert-list')
    const emptyState = page.locator('.empty-state')
    await expect(alertList.or(emptyState)).toBeVisible({ timeout: 10000 })
    // 搜索栏应可见
    await expect(page.locator('.search-bar')).toBeVisible({ timeout: 10000 })
    // 筛选标签应可见
    await expect(page.locator('.tabs')).toBeVisible({ timeout: 10000 })
  })
})
