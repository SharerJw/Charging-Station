import { test, expect } from '@playwright/test'
import { setupApiMocks } from '../fixtures/api-mocks'

test.describe('导航冒烟测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    // Mock auth login endpoint
    await page.route('**/api/auth/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0, message: 'success',
          data: {
            token: 'mock-token',
            user: { id: 'A001', username: 'admin', nickname: '超级管理员', avatar: '', roles: ['admin'] },
          },
        }),
      }),
    )
    await page.addInitScript(() => {
      localStorage.setItem('admin_token', 'mock-token-for-test')
    })
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
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
    await page.waitForLoadState('domcontentloaded')
    // 使用预设的admin凭据登录
    await page.getByPlaceholder('请输入用户名').fill('admin')
    await page.getByPlaceholder('请输入密码').fill('admin123')
    await page.getByRole('button', { name: '登录' }).click()
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    expect(page.url()).toContain('/dashboard')
  })
})
