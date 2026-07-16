import { type Page, type Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly statCards: Locator
  readonly deviceSelector: Locator
  readonly controlBar: Locator
  readonly charts: Locator
  readonly liveIndicator: Locator
  readonly pauseButton: Locator

  constructor(page: Page) {
    this.page = page
    this.statCards = page.locator('text=设备总数').locator('..')
    this.deviceSelector = page.locator('.el-select')
    this.controlBar = page.locator('text=暂停').locator('..')
    this.charts = page.locator('canvas')
    this.liveIndicator = page.locator('text=LIVE')
    this.pauseButton = page.locator('text=暂停')
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('domcontentloaded')
  }

  async waitForLoad() {
    await this.page.waitForSelector('text=设备总数', { timeout: 15000 })
    await this.page.waitForTimeout(500)
  }

  async getStatCardCount() {
    // Count the 4 stat cards: 设备总数, 在线设备, 充电中, 累计电量
    const statLabels = ['设备总数', '在线设备', '充电中', '累计电量']
    let count = 0
    for (const label of statLabels) {
      if (await this.page.locator(`text=${label}`).isVisible()) {
        count++
      }
    }
    return count
  }

  async getKpiValues() {
    const values = await this.page.evaluate(() => {
      const items = document.querySelectorAll('.el-col-6')
      return Array.from(items).map(item => {
        const value = item.querySelector('.text-2xl')?.textContent || '0'
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

  async selectDevice(index: number) {
    await this.deviceSelector.click()
    await this.page.locator('.el-select-dropdown__item').nth(index).click()
  }

  async isLiveVisible() {
    return this.liveIndicator.isVisible()
  }

  async isPauseButtonVisible() {
    return this.pauseButton.isVisible()
  }
}
