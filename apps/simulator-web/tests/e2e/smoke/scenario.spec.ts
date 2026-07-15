import { test, expect } from '@playwright/test'
import { ScenarioPage } from '../fixtures/page-objects/ScenarioPage'

test.describe('Scenario 冒烟测试', () => {
  let scenarioPage: ScenarioPage

  test.beforeEach(async ({ page }) => {
    scenarioPage = new ScenarioPage(page)
    await scenarioPage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/场景编排/)
    await scenarioPage.waitForLoad()
  })

  test('场景列表显示', async ({ page }) => {
    await scenarioPage.waitForLoad()
    await expect(scenarioPage.scenarioList).toBeVisible()
  })
})
