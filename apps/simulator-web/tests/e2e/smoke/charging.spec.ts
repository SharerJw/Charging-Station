import { test, expect } from '@playwright/test'
import { ChargingPage } from '../fixtures/page-objects/ChargingPage'

test.describe('Charging 冒烟测试', () => {
  let chargingPage: ChargingPage

  test.beforeEach(async ({ page }) => {
    chargingPage = new ChargingPage(page)
    await chargingPage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/充电模拟/)
    await chargingPage.waitForLoad()
  })

  test('SOC 环形图显示', async ({ page }) => {
    await chargingPage.waitForLoad()
    await expect(chargingPage.socRing).toBeVisible()
  })

  test('指标卡片显示', async ({ page }) => {
    await chargingPage.waitForLoad()
    const count = await chargingPage.getMetricCardCount()
    expect(count).toBeGreaterThanOrEqual(4)
  })
})
