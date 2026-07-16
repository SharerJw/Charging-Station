import { test, expect } from '@playwright/test'

test.describe('充电监控页', () => {
  test('充电页面应成功加载', async ({ page }) => {
    await page.goto('/#/pages/charging/index')
    await expect(page.locator('.charging-page')).toBeVisible()
  })

  test('无会话时应显示空状态或充电状态区域', async ({ page }) => {
    await page.goto('/#/pages/charging/index')
    // 页面加载后，要么显示空状态，要么显示充电状态卡片
    const emptyState = page.locator('.empty-state')
    const statusCard = page.locator('.status-card')
    await expect(emptyState.or(statusCard)).toBeVisible()
  })
})
