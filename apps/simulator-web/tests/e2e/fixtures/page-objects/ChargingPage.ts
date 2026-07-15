import { type Page, type Locator } from '@playwright/test'

export class ChargingPage {
  readonly page: Page
  readonly socRing: Locator
  readonly metricCards: Locator
  readonly startButton: Locator
  readonly stopButton: Locator

  constructor(page: Page) {
    this.page = page
    this.socRing = page.locator('.soc-ring')
    this.metricCards = page.locator('.metric-card')
    this.startButton = page.locator('text=启动充电')
    this.stopButton = page.locator('text=停止充电')
  }

  async goto() {
    await this.page.goto('/charging')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.socRing.waitFor({ state: 'visible' })
  }

  async getSocValue() {
    const text = await this.page.locator('.soc-value').textContent()
    return parseInt(text || '0', 10)
  }

  async getMetricCardCount() {
    return this.metricCards.count()
  }

  async startCharging() {
    await this.startButton.click()
  }

  async stopCharging() {
    await this.stopButton.click()
  }
}
