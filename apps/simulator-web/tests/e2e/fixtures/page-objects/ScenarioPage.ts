import { type Page, type Locator } from '@playwright/test'

export class ScenarioPage {
  readonly page: Page
  readonly scenarioList: Locator
  readonly createButton: Locator

  constructor(page: Page) {
    this.page = page
    this.scenarioList = page.locator('.scenario-list')
    this.createButton = page.locator('text=新建场景')
  }

  async goto() {
    await this.page.goto('/scenario')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.scenarioList.waitFor({ state: 'visible' })
  }

  async createScenario(name: string, description: string) {
    await this.createButton.click()
    await this.page.locator('[name="name"]').fill(name)
    await this.page.locator('[name="description"]').fill(description)
    await this.page.locator('text=保存').click()
  }

  async executeScenario(name: string) {
    await this.page.locator(`text=${name}`).click()
    await this.page.locator('text=执行').click()
  }

  async isScenarioVisible(name: string) {
    return this.page.locator(`text=${name}`).isVisible()
  }
}
