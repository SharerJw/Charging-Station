import { type Page, type Locator } from '@playwright/test'
import { setupApiMocks } from '../api-mocks'

export class DashboardPage {
  readonly page: Page
  readonly welcomeBar: Locator
  readonly kpiCards: Locator
  readonly revenueChart: Locator
  readonly stationRankChart: Locator
  readonly recentOrdersTable: Locator
  readonly todoList: Locator

  constructor(page: Page) {
    this.page = page
    this.welcomeBar = page.locator('.welcome-bar')
    this.kpiCards = page.locator('.kpi-card')
    this.revenueChart = page.locator('text=营收趋势')
    this.stationRankChart = page.locator('text=站点营收排行')
    this.recentOrdersTable = page.locator('text=最近订单')
    this.todoList = page.locator('.todo-list')
  }

  async goto() {
    await setupApiMocks(this.page)
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('domcontentloaded')
  }

  async waitForLoad() {
    await this.welcomeBar.waitFor({ state: 'visible', timeout: 10000 })
  }
}
