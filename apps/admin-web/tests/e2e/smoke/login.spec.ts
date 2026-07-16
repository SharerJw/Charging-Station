import { test, expect } from '@playwright/test'
import { LoginPage } from '../fixtures/page-objects/LoginPage'

let loginPage: LoginPage

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page)
  await loginPage.goto()
})

test.describe('登录页冒烟测试', () => {
  test('页面加载，显示登录表单', async () => {
    await loginPage.waitForLoad()
    await expect(loginPage.loginTitle).toBeVisible()
    await expect(loginPage.loginTitle).toHaveText('EV充电平台')
    await expect(loginPage.loginSubtitle).toBeVisible()
    await expect(loginPage.loginSubtitle).toHaveText('后台管理系统')
  })

  test('用户名密码输入框可见', async () => {
    await expect(loginPage.usernameInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
  })

  test('登录按钮可见', async () => {
    await expect(loginPage.loginButton).toBeVisible()
    await expect(loginPage.loginButton).toHaveText('登录')
  })
})
