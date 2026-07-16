import { type Page, type Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly loginTitle: Locator
  readonly loginSubtitle: Locator
  readonly rememberMeCheckbox: Locator
  readonly hint: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.getByPlaceholder('请输入用户名')
    this.passwordInput = page.getByPlaceholder('请输入密码')
    this.loginButton = page.getByRole('button', { name: '登录' })
    this.loginTitle = page.locator('.login-title')
    this.loginSubtitle = page.locator('.login-subtitle')
    this.rememberMeCheckbox = page.getByText('记住我')
    this.hint = page.locator('.login-hint')
  }

  async goto() {
    await this.page.goto('/login')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.loginTitle.waitFor({ state: 'visible', timeout: 10000 })
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }
}
