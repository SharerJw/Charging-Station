import { type Page, type Locator } from '@playwright/test'
import { setupApiMocks } from '../api-mocks'

export class DevicePage {
  readonly page: Page
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly table: Locator
  readonly statusSelect: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.getByPlaceholder('设备编号/OCPP ID')
    this.searchButton = page.getByRole('button', { name: '搜索' })
    this.table = page.locator('.el-table')
    this.statusSelect = page.locator('.el-select').filter({ hasText: '全部' }).first()
  }

  async goto() {
    await setupApiMocks(this.page)
    await this.page.goto('/device')
    await this.page.waitForLoadState('domcontentloaded')
  }

  async waitForLoad() {
    await this.table.waitFor({ state: 'visible', timeout: 10000 })
  }
}
