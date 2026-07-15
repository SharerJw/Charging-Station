import { type Page, type Locator } from '@playwright/test'

export class DevicePage {
  readonly page: Page
  readonly addButton: Locator
  readonly pageTitle: Locator

  constructor(page: Page) {
    this.page = page
    this.addButton = page.locator('text=添加设备')
    this.pageTitle = page.locator('text=设备管理')
  }

  async goto() {
    await this.page.goto('/device')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.pageTitle.waitFor({ state: 'visible' })
    await this.page.waitForTimeout(500)
  }

  async isAddButtonVisible() {
    return this.addButton.isVisible()
  }

  async clickAddButton() {
    await this.addButton.click()
  }

  async isDeviceVisible(name: string) {
    return this.page.locator(`text=${name}`).isVisible()
  }
}
