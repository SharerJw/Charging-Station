import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: 'Desktop 1920', width: 1920, height: 1080 },
  { name: 'Laptop 1366', width: 1366, height: 768 },
  { name: 'Tablet 768', width: 768, height: 1024 },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k')
  })
})

test.describe('视口兼容性', () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} 页面正常渲染`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/#/pages/index/index')
      await page.waitForLoadState('domcontentloaded')
      // 验证关键元素可见（UniApp H5 首页）
      await expect(
        page.locator('.index-page'),
      ).toBeVisible({ timeout: 15000 })
      // 验证无水平滚动
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const clientWidth = await page.evaluate(() => document.body.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // 5px tolerance
    })
  }
})
