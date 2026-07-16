import { test, expect } from '@playwright/test'
import { DashboardPage } from '../fixtures/page-objects/DashboardPage'

let dashboardPage: DashboardPage

test.beforeEach(async ({ page }) => {
  // Mock 登录态 - 设置 token 到 localStorage
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'mock-token-for-test')
  })
  dashboardPage = new DashboardPage(page)
  await dashboardPage.goto()
})

test.describe('工作台冒烟测试', () => {
  test('页面加载成功，标题含"工作台"', async ({ page }) => {
    await dashboardPage.waitForLoad()
    await expect(page).toHaveTitle(/工作台/)
    await expect(dashboardPage.welcomeBar).toBeVisible()
  })

  test('KPI 卡片显示（运营指标 + 设备指标）', async () => {
    await dashboardPage.waitForLoad()
    // 运营指标: 今日充电量、今日营收、今日订单数
    // 设备指标: 站点总数、设备在线率、累计电量
    const cards = dashboardPage.kpiCards
    await expect(cards).toHaveCount(6, { timeout: 15000 })
  })

  test('图表区域渲染', async () => {
    await dashboardPage.waitForLoad()
    await expect(dashboardPage.revenueChart).toBeVisible({ timeout: 15000 })
    await expect(dashboardPage.stationRankChart).toBeVisible()
  })

  test('最近订单表格显示', async () => {
    await dashboardPage.waitForLoad()
    await expect(dashboardPage.recentOrdersTable).toBeVisible({ timeout: 15000 })
  })
})
