import { test, expect } from '@playwright/test'

// Setup auth before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k')
  })
})

test.describe('找桩页', () => {
  test('找桩页面应成功加载', async ({ page }) => {
    await page.goto('/#/pages/map/index')
    await expect(page.locator('.map-page')).toBeVisible({ timeout: 10000 })
  })

  test('充电站列表区域应可见', async ({ page }) => {
    await page.goto('/#/pages/map/index')
    await page.waitForLoadState('domcontentloaded')
    const listSection = page.locator('.list-section')
    await expect(listSection).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.list-title')).toContainText('附近')
  })
})
