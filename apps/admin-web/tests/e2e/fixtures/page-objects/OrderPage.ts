import { type Page, type Locator } from '@playwright/test'

export class OrderPage {
  readonly page: Page
  readonly orderNoInput: Locator
  readonly searchButton: Locator
  readonly resetButton: Locator
  readonly table: Locator
  readonly statusSelect: Locator
  readonly dateRangePicker: Locator

  constructor(page: Page) {
    this.page = page
    this.orderNoInput = page.getByPlaceholder('请输入订单号')
    this.searchButton = page.getByRole('button', { name: '搜索' }).first()
    this.resetButton = page.getByRole('button', { name: '重置' })
    this.table = page.locator('.el-table')
    this.statusSelect = page.locator('.el-select').filter({ hasText: '全部' }).first()
    this.dateRangePicker = page.locator('.el-date-editor')
  }

  async goto() {
    await this.page.goto('/order')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.table.waitFor({ state: 'visible', timeout: 10000 })
  }
}
