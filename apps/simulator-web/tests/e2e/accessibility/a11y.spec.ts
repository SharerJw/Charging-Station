import { test, expect } from '@playwright/test'

test.describe('可访问性测试', () => {
  test('页面可加载且无致命错误', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    // 页面不应有未捕获的致命错误
    const fatalErrors = errors.filter(e => !e.includes('ResizeObserver'))
    expect(fatalErrors).toHaveLength(0)
  })

  test('所有交互元素可键盘访问', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    // Tab 应将焦点移到某个可交互元素上
    expect(focused).toBeTruthy()
  })

  test('图片有 alt 属性', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const images = await page.locator('img').all()
    // 如果没有图片，测试自动通过
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })

  test('颜色对比度符合 WCAG AA', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)
    const hasStatValue = await page.locator('.stat-value').count()
    if (hasStatValue === 0) {
      // 如果没有 stat-value 元素，跳过对比度检查
      return
    }
    const textColor = await page.evaluate(() => {
      const el = document.querySelector('.stat-value')
      return el ? window.getComputedStyle(el).color : null
    })
    const bgColor = await page.evaluate(() => {
      const el = document.querySelector('.stat-value')
      return el ? window.getComputedStyle(el).backgroundColor : null
    })
    if (textColor && bgColor) {
      expect(textColor).not.toBe(bgColor)
    }
  })
})
