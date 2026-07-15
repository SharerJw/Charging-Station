import { test, expect } from '@playwright/test'
import { DashboardPage } from '../fixtures/page-objects/DashboardPage'
import { testData } from '../fixtures/test-data'

test.describe('幽灵数据检测', () => {
  test('仪表盘 KPI 数据无幽灵数据', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    const readings = []

    // 连续刷新 5 次
    for (let i = 0; i < testData.thresholds.ghostDataRefreshCount; i++) {
      await dashboardPage.goto()
      await dashboardPage.waitForLoad()
      readings.push(await dashboardPage.getKpiValues())
    }

    // 验证数据一致性
    for (let i = 1; i < readings.length; i++) {
      expect(readings[i].totalDevices).toBe(readings[0].totalDevices)
      expect(readings[i].onlineDevices).toBe(readings[0].onlineDevices)
    }
  })

  test('设备列表数据稳定', async ({ page }) => {
    const readings = []

    for (let i = 0; i < 3; i++) {
      await page.goto('/device')
      await page.waitForLoadState('networkidle')
      const count = await page.locator('.device-item').count()
      readings.push(count)
    }

    // 验证设备数量一致
    expect(readings.every(r => r === readings[0])).toBe(true)
  })
})
