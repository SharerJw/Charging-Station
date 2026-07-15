import { type Page, type Locator } from '@playwright/test'

export class DevicePage {
  readonly page: Page
  readonly deviceList: Locator
  readonly addButton: Locator
  readonly nameInput: Locator
  readonly ocppIdInput: Locator
  readonly modelSelect: Locator
  readonly confirmButton: Locator

  constructor(page: Page) {
    this.page = page
    this.deviceList = page.locator('.device-list')
    this.addButton = page.locator('text=添加设备')
    this.nameInput = page.locator('[name="name"]')
    this.ocppIdInput = page.locator('[name="ocppId"]')
    this.modelSelect = page.locator('[name="model"]')
    this.confirmButton = page.locator('text=确定')
  }

  async goto() {
    await this.page.goto('/device')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.deviceList.waitFor({ state: 'visible' })
  }

  async addDevice(name: string, ocppId: string, model: string) {
    await this.addButton.click()
    await this.nameInput.fill(name)
    await this.ocppIdInput.fill(ocppId)
    await this.modelSelect.selectOption(model)
    await this.confirmButton.click()
  }

  async deleteDevice(name: string) {
    await this.page.locator(`text=${name}`).click()
    await this.page.locator('text=删除').click()
    await this.page.locator('text=确认').click()
  }

  async isDeviceVisible(name: string) {
    return this.page.locator(`text=${name}`).isVisible()
  }
}
