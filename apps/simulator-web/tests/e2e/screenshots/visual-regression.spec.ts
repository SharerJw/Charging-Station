import { test, expect } from '@playwright/test'
import { testData } from '../fixtures/test-data'

test.describe('视觉回归测试', () => {
  test.skip(true, 'Baseline screenshots not yet generated; run with --update-snapshots to create them')

  test('Dashboard 完整截图', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForSelector('.stat-card')
    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      maxDiffPixels: testData.thresholds.screenshotDiff,
    })
  })

  test('深色主题一致性', async ({ page }) => {
    await page.goto('/dashboard')
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    expect(bgColor).toBe(testData.colors.background)
  })

  test('响应式布局截图 - 桌面端', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/dashboard')
    await page.waitForSelector('.stat-card')
    await expect(page).toHaveScreenshot('dashboard-desktop.png')
  })

  test('响应式布局截图 - 平板端', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    await page.waitForSelector('.stat-card')
    await expect(page).toHaveScreenshot('dashboard-tablet.png')
  })

  test('响应式布局截图 - 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForSelector('.stat-card')
    await expect(page).toHaveScreenshot('dashboard-mobile.png')
  })
})
