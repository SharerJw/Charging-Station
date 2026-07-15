import { test, expect } from '@playwright/test'
import { DashboardPage } from '../fixtures/page-objects/DashboardPage'
import { ChargingPage } from '../fixtures/page-objects/ChargingPage'

test.describe('充电流程', () => {
  test('启动-监控-停止充电', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    const chargingPage = new ChargingPage(page)

    // 1. 选择设备
    await dashboardPage.goto()
    await dashboardPage.waitForLoad()
    await dashboardPage.clickDevice(0)

    // 2. 启动充电
    await chargingPage.startCharging()
    await expect(page.locator('text=充电中')).toBeVisible()

    // 3. 监控数据变化
    await page.waitForTimeout(2000)
    const soc = await chargingPage.getSocValue()
    expect(soc).toBeGreaterThan(0)

    // 4. 查看功率曲线
    await expect(page.locator('canvas')).toBeVisible()

    // 5. 停止充电
    await chargingPage.stopCharging()
    await page.locator('text=确认').click()
    await expect(page.locator('text=空闲')).toBeVisible()
  })
})
