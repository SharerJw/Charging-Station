import { type Page, type Locator } from '@playwright/test'

export class LogsPage {
  readonly page: Page
  readonly heading: Locator
  readonly pageTitle: Locator
  readonly terminal: Locator
  readonly logContainer: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h2.page-title:has-text("OCPP 消息终端")')
    this.pageTitle = page.locator('text=日志终端')
    this.terminal = page.locator('.terminal')
    this.logContainer = page.locator('.log-container, .terminal').first()
  }

  async goto() {
    await this.page.goto('/logs')
    await this.page.waitForLoadState('domcontentloaded')
  }

  async waitForLoad() {
    await this.page.waitForTimeout(1000) // Wait for page to load
  }

  async isPageLoaded() {
    return this.pageTitle.isVisible()
  }

  async hasErrors() {
    const errorOverlay = this.page.locator('.vite-error-overlay, [class*="error"]')
    return errorOverlay.isVisible()
  }
}
