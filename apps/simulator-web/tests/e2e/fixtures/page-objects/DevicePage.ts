import { type Page, type Locator } from '@playwright/test'

export class DevicePage {
  readonly page: Page
  readonly addButton: Locator
  readonly heading: Locator

  constructor(page: Page) {
    this.page = page
    this.addButton = page.locator('button:has-text("添加设备")')
    this.heading = page.locator('h2:has-text("设备管理")')
  }

  async goto() {
    await this.page.goto('/device')
    await this.page.waitForLoadState('domcontentloaded')
  }

  async waitForLoad() {
    await this.heading.waitFor({ state: 'visible', timeout: 15000 })
  }

  async isPageLoaded() {
    return this.heading.isVisible()
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
