import { type Page, type Locator } from '@playwright/test'

export class StationPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly resetButton: Locator
  readonly createButton: Locator
  readonly table: Locator
  readonly statusSelect: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.getByPlaceholder('名称/地址/编号')
    this.searchButton = page.getByRole('button', { name: '搜索' })
    this.resetButton = page.getByRole('button', { name: '重置' })
    this.createButton = page.getByRole('button', { name: '新增充电站' })
    this.table = page.locator('.el-table')
    this.statusSelect = page.locator('.el-select').filter({ hasText: '全部' }).first()
  }

  async goto() {
    await this.page.goto('/station')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.table.waitFor({ state: 'visible', timeout: 10000 })
  }
}
