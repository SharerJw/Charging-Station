import { test, expect } from '@playwright/test'

test.describe('登录页', () => {
  test('登录页应成功加载', async ({ page }) => {
    await page.goto('/#/pages/login/index')
    await expect(page.locator('.login-page')).toBeVisible()
  })

  test('登录按钮应可见', async ({ page }) => {
    await page.goto('/#/pages/login/index')
    await expect(page.locator('.login-btn')).toBeVisible()
    await expect(page.locator('.login-btn')).toContainText('登录')
  })
})
