import { test, expect } from '@playwright/test'

// Setup auth before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k')
  })
})

test.describe('充电监控页', () => {
  test('充电页面应成功加载', async ({ page }) => {
    await page.goto('/#/pages/charging/index')
    await expect(page.locator('.charging-page')).toBeVisible({ timeout: 10000 })
  })

  test('无会话时应显示空状态或充电状态区域', async ({ page }) => {
    await page.goto('/#/pages/charging/index')
    // 页面加载后，要么显示空状态，要么显示充电状态卡片
    const emptyState = page.locator('.empty-state')
    const statusCard = page.locator('.status-card')
    await expect(emptyState.or(statusCard)).toBeVisible({ timeout: 10000 })
  })
})
