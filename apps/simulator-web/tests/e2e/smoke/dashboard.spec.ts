import { test, expect } from '@playwright/test'
import { DashboardPage } from '../fixtures/page-objects/DashboardPage'

test.describe('Dashboard 冒烟测试', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/仪表盘/)
    await dashboardPage.waitForLoad()
    const count = await dashboardPage.getStatCardCount()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('设备卡片显示', async ({ page }) => {
    await dashboardPage.waitForLoad()
    await expect(dashboardPage.deviceCards.first()).toBeVisible()
  })

  test('图表渲染完成', async ({ page }) => {
    await dashboardPage.waitForLoad()
    const chartCount = await dashboardPage.charts.count()
    expect(chartCount).toBeGreaterThanOrEqual(3)
  })

  test('控制栏功能', async ({ page }) => {
    await dashboardPage.waitForLoad()
    await expect(dashboardPage.controlBar).toBeVisible()
    const isLive = await dashboardPage.isLiveVisible()
    expect(isLive).toBe(true)
  })
})
