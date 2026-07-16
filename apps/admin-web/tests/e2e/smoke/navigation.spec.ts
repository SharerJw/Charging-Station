import { test, expect } from '@playwright/test'

test.describe('导航冒烟测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-token-for-test')
    })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('侧边栏菜单项可点击', async ({ page }) => {
    const menuItems = page.locator('.el-menu-item')
    await expect(menuItems.first()).toBeVisible({ timeout: 10000 })
    const count = await menuItems.count()
    expect(count).toBeGreaterThan(0)
  })

  test('跳转后URL正确', async ({ page }) => {
    await page.locator('.el-menu-item').filter({ hasText: '站点管理' }).click()
    await page.waitForURL('**/station')
    expect(page.url()).toContain('/station')
  })

  test('登录后跳转到dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    // 使用预设的admin凭据登录
    await page.getByPlaceholder('请输入用户名').fill('admin')
    await page.getByPlaceholder('请输入密码').fill('admin123')
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    expect(page.url()).toContain('/dashboard')
  })
})
