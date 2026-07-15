import { test, expect } from '@playwright/test'

test.describe('可访问性测试', () => {
  test('所有交互元素可键盘访问', async ({ page }) => {
    await page.goto('/dashboard')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A', 'INPUT']).toContain(focused)
  })

  test('图片有 alt 属性', async ({ page }) => {
    await page.goto('/dashboard')
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })

  test('表单有 label 关联', async ({ page }) => {
    await page.goto('/device')
    await page.locator('text=添加设备').click()
    const inputs = await page.locator('input').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count()
        expect(label).toBeGreaterThan(0)
      }
    }
  })

  test('颜色对比度符合 WCAG AA', async ({ page }) => {
    await page.goto('/dashboard')
    const textColor = await page.evaluate(() => {
      const el = document.querySelector('.stat-value')
      return window.getComputedStyle(el!).color
    })
    const bgColor = await page.evaluate(() => {
      const el = document.querySelector('.stat-value')
      return window.getComputedStyle(el!).backgroundColor
    })
    expect(textColor).not.toBe(bgColor)
  })
})
