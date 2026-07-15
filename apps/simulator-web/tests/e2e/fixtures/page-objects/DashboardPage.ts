import { type Page, type Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly statCards: Locator
  readonly deviceCards: Locator
  readonly controlBar: Locator
  readonly charts: Locator
  readonly liveIndicator: Locator

  constructor(page: Page) {
    this.page = page
    this.statCards = page.locator('.stat-card')
    this.deviceCards = page.locator('.device-card')
    this.controlBar = page.locator('.control-bar')
    this.charts = page.locator('canvas')
    this.liveIndicator = page.locator('text=LIVE')
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.statCards.first().waitFor({ state: 'visible' })
    await this.page.waitForTimeout(500)
  }

  async getStatCardCount() {
    return this.statCards.count()
  }

  async getDeviceCardCount() {
    return this.deviceCards.count()
  }

  async getKpiValues() {
    const values = await this.page.evaluate(() => {
      const cards = document.querySelectorAll('.stat-card')
      return Array.from(cards).map(card => {
        const value = card.querySelector('.stat-value')?.textContent || '0'
        return parseInt(value.replace(/[^0-9]/g, ''), 10)
      })
    })
    return {
      totalDevices: values[0] || 0,
      onlineDevices: values[1] || 0,
      chargingDevices: values[2] || 0,
      totalEnergy: values[3] || 0,
    }
  }

  async clickDevice(index: number) {
    await this.deviceCards.nth(index).click()
  }

  async isLiveVisible() {
    return this.liveIndicator.isVisible()
  }
}
