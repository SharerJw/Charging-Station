import { test, expect } from '@playwright/test'

test.describe('登录页', () => {
  test('登录页应正确加载', async ({ page }) => {
    await page.goto('/#/pages/login/index')
    await expect(page.locator('.login-page')).toBeVisible({ timeout: 10000 })
  })

  test('登录按钮应可见', async ({ page }) => {
    await page.goto('/#/pages/login/index')
    const loginBtn = page.locator('.login-btn')
    await expect(loginBtn).toBeVisible({ timeout: 10000 })
    await expect(loginBtn).toContainText('登录')
  })
})
