import { type Page, type Locator } from '@playwright/test'

export class LogsPage {
  readonly page: Page
  readonly terminal: Locator
  readonly messageLines: Locator

  constructor(page: Page) {
    this.page = page
    this.terminal = page.locator('.xterm')
    this.messageLines = page.locator('.message-line')
  }

  async goto() {
    await this.page.goto('/logs')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.terminal.waitFor({ state: 'visible' })
  }

  async getMessageCount() {
    return this.messageLines.count()
  }

  async isTerminalVisible() {
    return this.terminal.isVisible()
  }
}
