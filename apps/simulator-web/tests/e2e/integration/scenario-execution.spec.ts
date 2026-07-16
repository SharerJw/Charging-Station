import { test, expect } from '@playwright/test'
import { ScenarioPage } from '../fixtures/page-objects/ScenarioPage'
import { testData } from '../fixtures/test-data'

test.describe('场景执行', () => {
  test.skip(true, 'Integration test requires full scenario execution UI which may not be implemented')

  test('创建并执行场景', async ({ page }) => {
    const scenarioPage = new ScenarioPage(page)

    // 1. 创建场景
    await scenarioPage.goto()
    await scenarioPage.createScenario(
      testData.scenario.name,
      testData.scenario.description
    )

    // 2. 配置场景步骤
    await page.locator('text=添加步骤').click()
    await page.locator('[name="action"]').selectOption('startCharging')
    await page.locator('[name="duration"]').fill('60')
    await page.locator('text=确定').click()

    // 3. 执行场景
    await scenarioPage.executeScenario(testData.scenario.name)
    await expect(page.locator('text=执行中')).toBeVisible()

    // 4. 等待执行完成
    await page.waitForSelector('text=已完成', { timeout: 120000 })

    // 5. 查看执行结果
    await expect(page.locator('.execution-log')).toBeVisible()
  })
})
